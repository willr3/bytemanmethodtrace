import React, { useState, useEffect, useReducer } from 'react';

import CssBaseline from '@material-ui/core/CssBaseline';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import Paper from '@material-ui/core/Paper';

import material from './material';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';

import MaterialTable from 'material-table';

import ChevronRightIcon from '@material-ui/icons/ChevronRight';

import Tree from './components/Tree';
import TreeIcon from './components/TreeIcon';
import Flamegraph, { buildHierarchy } from './components/Flamegraph';
import ListColumn from './components/ListColumn';
import TreeTable from './components/TreeTable';

import { walk, flattenTree, uidGenerator } from './selectors/tree';
import {getUid} from './redux/state';

const fromNano = (ns) => {
  if (ns > 1000000000) {
    return Number(ns / 1000000000.0).toFixed(3) + ' s'
  } else if (ns > 1000000) {
    return Number(ns / 1000000.0).toFixed(3) + ' ms'
  } else {
    return ns + ' ns'
  }
}

const styles = theme => ({
  root: {
    height: '100%',
    width: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    maxWidth: '100vw',
    maxHeight: '100vh',
  },
  fillColumn: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '100vh',
    overflow: 'hidden',
    maxWidth: "100%",
  },
  body: {
    flexGrow: 1,
    maxWidth: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
  },
  subsystem: {
    fontSize: 10,
  },
  toolbar: {
    borderBottom: 'solid 1px #dadce0',
    backgroundColor: 'white',
    flexGrow: 0,
  },
  paper: {
    
    margin: 24,
    padding: 8,
  },

})
const App = ({ classes, width = "100%", colors, loaded }) => {
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      // case 'increment': return { index: Math.min(built.length - 1, state.index + 1) }
      // case 'decrement': return { index: Math.max(0, state.index - 1) }
      case 'select': return { index: action.data }
      default:
        throw new Error();
    }
  }, { index: 0 })
  const onPress = (e) => {
    if (e.key === "ArrowRight") {
      //dispatch({ type: 'increment' })
    } else if (e.key === "ArrowLeft") {
      //dispatch({ type: 'decrement' })
    }
  }
  useEffect(() => {
    window.addEventListener('keydown', onPress);
    return () => {
      window.removeEventListener('keydown', onPress);
    }
  }, []);
  return (
    <div className={classes.root}>
      <CssBaseline />
      <ListColumn
        title={
          <React.Fragment>
            <div><Typography variant="h6">{loaded.getData().length} Trees</Typography></div>
            <Typography variant="overline">{loaded.getData().map(v=>v.count).reduce((a,b)=>a+b,0)} samples</Typography>
          </React.Fragment>

        }
        data={loaded.getData()}
        sortOptions={{ "Samples": "_count", "Time": "_avg", "Methods":"leafs" }}
      >{(entry, entryIndex, all) => {
        const entryUid = getUid(entry)
        return (<ListItem

          button={true}
          key={entryIndex}
          onClick={(e) => dispatch({ type: 'select', data: entryUid })}
          selected={state.index === entryUid}
        >
          <ListItemIcon>
            <TreeIcon data={loaded.getFlatTree(entryUid)} colors={colors} />
          </ListItemIcon>
          <ListItemText
            primary={`${entry._count} in ${Number(entry._avg).toFixed(3)}ms`}
            secondary={`${entry.leafs} methods`}
          />
        </ListItem>)
      }}</ListColumn>
      <div className={classes.fillColumn}>
        <Toolbar className={classes.toolbar}>
          <div style={{}}>{state.index ? loaded.getData(state.index).leafs : ""}</div>
          <div style={{ marginLeft: 'auto' }}></div>
        </Toolbar>
        <div className={classes.body}>

          {state.index ? (
            <React.Fragment>
              <Paper className={classes.paper}>
                <Flamegraph
                  data={loaded.getHierarchy(state.index)}
                  colors={colors}
                  width={"100%"}
                />
              </Paper>

              <Paper className={clsx(classes.paper,classes.overflow)}>
                <TreeTable
                  data={loaded.getData(state.index)}
                  columns={[
                    { name: "Total", render: (v) => Number(v._avg).toFixed(3) },
                    { name: "Self", render: (v) => Number(v._self).toFixed(3) }
                  ]}
                  render={(v) => {
                    return `${v.subsystem}::${v.method}`
                  }}
                />
              </Paper>
            </React.Fragment>
          ): (<Typography style={{margin: 'auto'}}>Select a Call Tree</Typography>)}
        </div>
      </div>


    </div>
  );
}
App.defaultProps = {
  colors: (data) => {
    const defaultColors = {
      "HHH": material.blue['300'],
      "EJB3": material.orange['300'],
      "JBOSSAS": material.green['300'],
      "JCA": material.red['300'],

    }
    const found = Object.keys(defaultColors).filter((key) => data.subsystem.includes(key));
    if (found && found.length > 0) {
      return defaultColors[found[0]]
    } else {
      return material.grey['400'];//TODO create predictible color gradient
    }
  }

}
export default withStyles(styles)(App);
