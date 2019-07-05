import React, {useState} from 'react';
import { withStyles } from '@material-ui/core/styles';
import { useTheme } from '@material-ui/styles';

import clsx from 'clsx';
import {Set} from 'immutable';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';


import ChevronRightIcon from '@material-ui/icons/ChevronRight';

import {flattenTree, walk, uidGenerator} from '../selectors/tree';

const styles = theme => ({
    root: {

    },
    treeCell: {

    },
    childIcon: {
        display: 'inline-flex',
        verticalAlign: 'middle',
        cursor: 'pointer',
    },
    closed: {
        transition: 'all 200ms ease 0s; margin-left: 0px; transform: rotate(0deg)'
    },
    expanded: {
        transition: 'all 200ms ease 0s; margin-left: 0px; transform: rotate(90deg)'
    },

})
const TreeTable = ({classes,data,getChildren=v=>v.children,render=v=>JSON.stringify(v),columns=[{name:"Total",key:"_avg"}] })=>{

    walk(data,uidGenerator("uid"))
    const getUid = v=>v.uid
    const flatTree = flattenTree(
        data,
        getChildren,
        getUid,
        v=>{delete v.children}
    );
    const [collapsed,setCollapsed] = useState(Set([]))

    const rows = []
    const first = flatTree[Object.keys(flatTree)[0]]
    const theme = useTheme();

    walk(first,(v,index,size,parent)=>{
        const uid = getUid(v.data)
        const isCollapsed = collapsed.has(uid);
        const hasChildren = getChildren(v) && getChildren(v).length > 0;
        let pad = Math.max(0,(1+v.depth)*24-(hasChildren ? 24 : 0));//TODO icon width
        rows.push(
            <TableRow key={uid}>
                <TableCell 
                    className={classes.treeCell} 
                    component="th" 
                    scope="row"
                    style={{paddingLeft: pad}}
                >
                    {hasChildren && <ChevronRightIcon 
                        className={
                            clsx(classes.childIcon, 
                                isCollapsed ? classes.closed : classes.expanded
                            )
                        } 
                        onClick={(e)=>{
                            setCollapsed(isCollapsed ? collapsed.delete(uid) : collapsed.add(uid));
                        }}
                    />}
                    <span>{render(v.data)}</span>
                </TableCell>
                {
                    columns.map((column,columnIndex)=>{
                        let value = ""
                        if(column.key){
                            value = v.data[column.key]
                        }else if (column.render){
                            value = column.render(v.data);
                        }else{
                            value = v.data[column.name]
                        }
                        return(
                        <TableCell align="right" key={columnIndex}>{value}</TableCell>
                        )
                })
                }
            </TableRow>
        )

        
    },
    (entry)=>{
        const uid = getUid(entry.data)
        const isCollapsed = collapsed.has(uid);
        return entry.children && !isCollapsed ? entry.children.map(childId=>flatTree[childId]).filter(v=>v!==undefined) : undefined;
    },
    true);

    return (
        <Table size="small">
            <TableHead>
                <TableRow>
                    <TableCell className={classes.treeCell} align="left">Method</TableCell>
                    {
                        columns.map((column,columnIndex)=>(
                            <TableCell key={columnIndex} align="right">{column.name}</TableCell>
                        ))
                    }
                </TableRow>
            </TableHead>
            <TableBody>{rows}</TableBody>
        </Table>
    )
}

export default withStyles(styles)(TreeTable);