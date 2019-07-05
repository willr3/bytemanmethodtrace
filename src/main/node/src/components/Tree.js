import React, { useState, useEffect, useReducer } from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import {Set} from 'immutable';

import {flattenTree, walk, uidGenerator} from '../selectors/tree';

const CHILD_PREFIX = "├";
const LAST_CHILD_PREFIX = "└";
const MORE_CHILDREN_PREFIX = "│";
const NO_MORE_CHILDREN_PREFIX = " ";

const collapsed = "◆";
const expanded = "◇";

const styles = theme => ({
    root: {
        height: '100%',
        width: '100%'
    },
    branch: {

    },
    prefix:{
        
    },
    highlighted:{

    },
    leaf:{
        cursor: 'pointer',
    },
    rendered:{

    }

})

const Branch = ({classes,isCollapsed,isHighlighted,isParentHighlighted,prefix,data,render,onToggle})=>{
    return (
        <div className={classes.branch}>
            <span className={classes.prefix}>
                {prefix}
            </span>
            <span className={classes.leaf} onClick={onToggle}>
                {isCollapsed?collapsed:expanded}
            </span>
            <span className={classes.rendered}>{render(data)}</span>
        </div>
    )
}


const Tree = ({classes,data,getChildren=v=>v.children,render=v=>JSON.stringify(v)})=>{
    
    walk(data,uidGenerator("uid"))
    const getUid = v=>v.uid
    const flatTree = flattenTree(
        data,
        getChildren,
        getUid,
        v=>{delete v.children}
    );
    const [collapsed,setCollapsed] = useState(Set([]))

    const branches = []
    let prefix=""
    let isFirst = true;
    
    const first = flatTree[Object.keys(flatTree)[0]]
    walk(first,(v,index,size)=>{
        
        const uid = getUid(v.data)
        const isLast = index === size-1
        const isCollapsed = collapsed.has(uid);
        prefix = prefix.substring(0,v.depth-1);
        branches.push(
            (<Branch
                key={`${uid}.${index}:${size}`}
                classes={classes}
                isCollapsed={isCollapsed}
                
                isHighlighted={false}
                isParentHighlighted={false}
                prefix={prefix + (isFirst ? "" : isLast ? LAST_CHILD_PREFIX : CHILD_PREFIX)}
                data={v.data}
                onToggle={(e)=>{
                    if(collapsed.has(uid)){
                        setCollapsed(collapsed.delete(uid))
                    }else{
                        setCollapsed(collapsed.add(uid))
                    }
                
                }}  
                render={(data)=>render(data)}
            />)
        )
        isFirst = false;        
        prefix = prefix + (isLast ? NO_MORE_CHILDREN_PREFIX : MORE_CHILDREN_PREFIX)
        },
        (entry)=>{
            const uid = getUid(entry.data)
            const isCollapsed = collapsed.has(uid);
            return entry.children && !isCollapsed ? entry.children.map(childId=>flatTree[childId]).filter(v=>v!==undefined) : undefined;
        },
        true //depthFirst
    )
    return (
        <div><pre>{branches}</pre></div>
    )
}

export default withStyles(styles)(Tree);