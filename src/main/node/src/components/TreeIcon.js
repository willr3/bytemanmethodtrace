import React, { useState, useEffect, useReducer } from 'react';
import { withStyles } from '@material-ui/core/styles';
import {Set} from 'immutable';
import {flattenTree, walk, uidGenerator} from '../selectors/tree';
import {getUid} from '../redux/state';

const TreeIcon = ({data,getChildren=v=>v.children,colors=(e)=>'grey'})=>{
    const first = data[Object.keys(data)[0]]
    const branches = []
    const height=1.5;
    const width=10
    let count=0;
    const pad=5;
    walk(first,(v,index,size)=>{
        const color = colors(v.data) || "grey";
        branches.push(
            (<rect key={getUid(v.data)} style={{fill:color,stroke:color}} stroke={color} fill={color} width={width} height={height} x={pad*v.depth} y={count*height}></rect>)
        );
        count++;
        },
        (entry)=>{
            return entry.children ? entry.children.map(childId=>data[childId]).filter(v=>v!==undefined) : undefined;
        },
        true //depthFirst
    )
    return (//viewBox="0 0 24 24"
        <svg className="MuiSvgIcon-root" width="24" height="24"  focusable="false">{branches}</svg>
    )
}

export default TreeIcon;