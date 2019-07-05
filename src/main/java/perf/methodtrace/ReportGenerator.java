package perf.methodtrace;

import io.hyperfoil.tools.parse.Exp;
import io.hyperfoil.tools.yaup.StringUtil;
import io.hyperfoil.tools.yaup.file.FileUtility;
import io.hyperfoil.tools.yaup.json.Json;
import io.hyperfoil.tools.yaup.time.SystemTimer;
import org.aesh.AeshRuntimeRunner;
import org.aesh.command.Command;
import org.aesh.command.CommandDefinition;
import org.aesh.command.CommandResult;
import org.aesh.command.invocation.CommandInvocation;
import org.aesh.command.option.Option;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;

@CommandDefinition(name="generate-report", description = "generate a report from Hyperfoil output files")
public class ReportGenerator implements Command {

   public static final String DEFAULT_TOKEN = "[/**DATAKEY**/]";
   public static final String ENTRY = "ENTRY";
   public static final String EXIT = "EXIT";


   @Option(shortName = 's', required = true, description = "source folder or archive containing hyperfoil output files")
   private String source;

   @Option(shortName = 'd', required = true, description = "destination for output report file")
   private String destination;

   @Option(shortName = 't', required = false, description = "use a custom html template file", defaultValue = "")
   private String template;

   @Option(shortName = 'x', required = false, description = "replace token in html template file",defaultValue = DEFAULT_TOKEN)
   private String token;

   public static void main(String[] args) {

      System.out.println(System.currentTimeMillis());
      AeshRuntimeRunner.builder().command(ReportGenerator.class).args(args).execute();
   }

   public static Json clean(Json input){
      input.remove("direction");
      input.remove("isChild");
      Json rtrn = new Json();
      if(input.has("duration")) {
//         rtrn.add("duration", input.getLong("duration"), true);
         rtrn.set("mean",1.0*input.getLong("duration"));
         rtrn.set("count",1);
         if(input.getLong("duration") == 0){
            System.out.println("how do we clean w/o duration "+input);
            System.exit(0);
         }
      }else{
         System.out.println("how do we clean w/o duration "+input);
         System.exit(0);
      }
      rtrn.set("subsystem",input.get("subsystem"));
      rtrn.set("method",input.get("method"));
      if(input.has("children")){
         input.getJson("children").forEach(child->{
            rtrn.add("children",clean((Json)child),true);
         });
      }
      return rtrn;
   }
   public static String shape(Json input){
      StringBuilder sb = new StringBuilder();
      shape(input,sb);
      return sb.toString();
   }
   private static void shape(Json input,StringBuilder sb){
      sb.append(input.getString("method"));
      if(input.has("children")){
         sb.append("[:");
         input.getJson("children").forEach(child->{
            shape((Json)child,sb);
            sb.append(":");
         });
         sb.append("]");
      }

   }
   public static void merge(Json from, Json to){
      if(!from.has("mean") || from.getLong("mean") == 0){
         System.out.println("cannot merge without mean "+from);
         System.exit(0);
      }
      to.set("count",to.getLong("count")+1);
      to.set("mean",to.getDouble("mean") + ( (from.getDouble("mean") - to.getDouble("mean"))/ to.getLong("count")));
      //to.add("duration",from.getJson("duration").getLong(0));
      if(from.has("children")){
         if(to.has("children")){
            if(to.getJson("children").size() == from.getJson("children").size()){
               for(int i=0; i<from.getJson("children").size(); i++){
                  merge(from.getJson("children").getJson(i),to.getJson("children").getJson(i));
               }
            }else{
               System.err.println("tried to merge json that don't match\n  from:"+from+"\n  to:"+to);
               System.exit(0);
            }
         }else{
            System.err.println("tried to merge json that don't match\n  from:"+from+"\n  to:"+to);
            System.exit(0);
         }
      }else{
         if (to.has("children")){
            System.err.println("tried to merge json that don't match\n  from:"+from+"\n  to:"+to);
            System.exit(0);
         }
      }

   }


   @Override
   public CommandResult execute(CommandInvocation commandInvocation) {
      Map<Long, Stack<Json>> threadStacks = new HashMap<>();
      Map<String,Json> shapes = new HashMap<>();
      /*
      380:HHH:SharedSessionContractImplementor.initializeCollection:ENTRY:4286022262691323
      380:HHH:SharedSessionContractImplementor.initializeCollection:EXIT:4286022263050922
       */
      Exp exp = new Exp("line","^(?<timestamp>\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2},\\d{3}) (?<threadId>\\d+):(?<subsystem>[^:]+):(?<method>[^:]+):(?<direction>[^:]+):(?<nanoTime>\\d+)$");
      /**
       * 2lc = "/home/wreicher/perfWork/bitmark/1137.zip#archive/run/benchserver4.perf.lab.eng.rdu2.redhat.com/subsystem-tracing.out"
       * no2lc = "/home/wreicher/perfWork/bitmark/1136.zip#archive/run/benchserver4.perf.lab.eng.rdu2.redhat.com/subsystem-tracing.out"
       * 500 = "/home/wreicher/perfWork/bitmark/1142.zip#archive/run/benchserver4.perf.lab.eng.rdu2.redhat.com/subsystem-tracing.out"
       * jca = "/home/wreicher/perfWork/bitmark/1151.zip#archive/run/benchserver4.perf.lab.eng.rdu2.redhat.com/subsystem-tracing.out"
       *
       */

      SystemTimer timer = new SystemTimer("parse");
      timer.start();
      FileUtility.stream(getSource()).forEach(line->{
         try {
            int firstSpace = line.indexOf(" ");
            int secondSpace = line.indexOf(" ", firstSpace + 1);
            String timestamp = line.substring(0, secondSpace);
            String split[] = line.substring(secondSpace + 1).split(":");
            Json matched = new Json();
            matched.set("timestamp", timestamp);
            matched.set("threadId", Long.parseLong(split[0]));
            matched.set("subsystem", split[1]);
            matched.set("method", split[2]);
            matched.set("direction", split[3]);
            matched.set("nanoTime", Long.parseLong(split[4]));
            //Json matched = exp.apply(line);
            if (matched.isEmpty()) {
               System.err.println("WTF failed to parse ||" + line + "||");
               System.exit(0);
            }

            threadStacks.putIfAbsent(matched.getLong("threadId"), new Stack<>());
            Stack<Json> stack = threadStacks.get(matched.getLong("threadId"));

            if (stack.isEmpty()) {
               stack.push(matched);
            } else if (ENTRY.equals(matched.getString("direction"))) {
               stack.peek().add("children", matched, true);
               matched.set("isChild", true);
               stack.push(matched);
            } else if (stack.peek().getString("method").equals(matched.getString("method")) && ENTRY.equals(stack.peek().getString("direction"))) {
               Json closed = stack.pop();
               closed.set("duration", matched.getLong("nanoTime") - closed.getLong("nanoTime"));
               if (closed.getLong("duration") == 0) {
                  System.out.println("how is it 0 " + closed);
                  System.exit(0);
               }
               if (!closed.has("isChild")) {

                  Json clean = clean(closed);
                  String shape = shape(clean);
                  if (!shapes.containsKey(shape)) {
                     shapes.put(shape, clean);
                     System.out.println("shapes.size=" + shapes.size());
                  } else {
                     merge(clean, shapes.get(shape));
                  }
                  //all.add(closed);
               }
            } else {
               //possibly an exception caused us to miss an exit
               System.err.println("WTF missed an exit (or more)" + matched);

               for (int i = 0; i < stack.size(); i++) {
                  System.err.println("stack[" + i + "]=" + stack.get(i).toString());
               }
               System.exit(0);

            }
         }catch(Exception e){
            e.printStackTrace();
         }
      });
      timer.stop();

      //System.out.println("all.size="+all.size());
      System.out.println("shapes.size="+shapes.size());
      System.out.println("in "+ StringUtil.durationToString(timer.milliTime()));

      Json shapeJson = new Json();
      shapes.values().forEach(shape->{

         AtomicLong counter = new AtomicLong(0);
         walk(shape,(v)->{counter.incrementAndGet();},v->{
            List<Json> rtrn = new LinkedList<>();
            if(v.has("children")){
               v.getJson("children").forEach(child->rtrn.add((Json)child));
            }
            return rtrn;
         });
         shape.set("leafs",counter.get());
         shapeJson.add(shape);
      });
      try {
         if(getDestination().endsWith("json")){
            Files.write(Paths.get(getDestination()),shapeJson.toString().getBytes());
         }else{
            boolean ok = write(shapeJson,getDestination(),getTemplate(),getToken());
            if(!ok){
               return CommandResult.FAILURE;
            }
         }
      } catch (IOException e) {
         e.printStackTrace();
      }


      return CommandResult.SUCCESS;
   }
   public static boolean write(Json content,String destination, String template, String token){
      try (
         BufferedReader reader =
            new BufferedReader(
               new InputStreamReader(
                  (template==null || template.isEmpty()) ? ReportGenerator.class.getClassLoader().getResourceAsStream("index.html") : new FileInputStream(template)
               )
            )
      ) {
         String indexHtml = reader.lines().collect(Collectors.joining("\n"));
         indexHtml = indexHtml.replace(token,content.toString());
         Files.write(Paths.get(destination),indexHtml.getBytes());
      } catch (FileNotFoundException e) {
         e.printStackTrace();
         return false;
      } catch (IOException e) {
         e.printStackTrace();
         return false;
      }
      return true;
   }

   public static void walk(Json target, Consumer<Json> todo, Function<Json, List<Json>> getChildren){
      todo.accept(target);
      List<Json> children = getChildren.apply(target);
      if(children !=null && !children.isEmpty()){
         children.forEach(child->walk(child,todo,getChildren));
      }
   }

   public String getToken() {
      return token;
   }

   public void setToken(String token) {
      this.token = token;
   }

   public String getTemplate() {
      return template;
   }

   public void setTemplate(String template) {
      this.template = template;
   }

   public String getDestination() {
      return destination;
   }

   public void setDestination(String destination) {
      this.destination = destination;
   }

   public void setSource(String source) {
      this.source = source;
   }
   public String getSource(){return source;}
}
