
export const uidGenerator = (key)=>{
    let uid = 1;
    return (v)=>{
        if(typeof v[key] === "undefined"){
            v[key]=uid;
            uid++;
        }
    }

}
export const walk = (treeData={},todo=v=>{},getChildren=v=>v.children,isDepthFirst=false)=>{
    const stack = []
    stack.push(
        {
            data:treeData,
            index:0,
            parent:undefined,
            size:1,
        }
    );
    while(stack.length>0){
        const current = stack.shift();
        todo(current.data,current.index,current.size,current.parent);
        let children = getChildren(current.data);
        if(typeof children !== "undefined" && Array.isArray(children)){
            if(isDepthFirst){
                children = [...children].reverse();
            }
            children.forEach((child,childIndex)=>{
                const newEntry = {
                    data:child,
                    index:isDepthFirst ? children.length-1-childIndex : childIndex,
                    size:children.length,
                    parent:current
                }
                if(isDepthFirst){
                    stack.unshift(newEntry);   
                }else{
                    stack.push(newEntry);
                }
                
            });
        }
    }
}
export const flattenTree = (treeData,getChildren=v=>v.children,getUid=v=>v.uid,deleteChildren=v=>{delete v.children})=>{
    const tree = {}
    const stack = []
    
    stack.push(treeData);

    while(stack.length>0){
        const current = stack.shift();
        const data = {...current}
        deleteChildren(data);
        const currentUid = getUid(current)
        const children = getChildren(current)
        const stackUid = stack.length > 0 ? getUid(stack[0]) : null
        if(!tree[currentUid]){
            tree[currentUid]={
                parent: null,
                previous: null,
                depth:0,
            }
        }
        tree[currentUid]={
            uid: currentUid,
            firstChild : children && children.length > 0 ?getUid(children[0]) : null,
            next: stackUid,
            parent: tree[currentUid].parent,
            previous: tree[currentUid].previous,
            
            //collapsed: false, //tracking outside of tree so fewer recomputes
            data: data,
            children: []
        }
        if(typeof tree[currentUid].depth === "undefined"){
            tree[currentUid].depth = tree[currentUid].parent ? tree[tree[currentUid].parent].depth+1 : 0;
        }     
        if(stackUid){
            tree[stackUid].previous=currentUid;
        }
        if(children && Array.isArray(children)){
            for(let i=children.length-1; i>=0; i--){
                const child = children[i]
                const uid = getUid(child);
                if(!tree[uid]){
                    tree[uid]={
                        previous:currentUid,
                        depth:tree[currentUid].depth+1,
                    }
                }
                tree[currentUid].children.unshift(uid);//because we traferse in reverse order
                tree[uid].parent = currentUid;
                stack.unshift(children[i]);
            }
        }
    }
    return tree;
}