import React, { useState, useEffect, useReducer } from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import {Set} from 'immutable';

import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';

export const getDepth = (val) => {
    const { children } = val;
    const max = (children && children.length > 0 ? Math.max.apply(null, children.map(getDepth)) : 0)
    const rtrn = 1 + max;
    return rtrn;
}
export const buildHierarchy = (root, valueAccessor, childAccessor = (v) => v.children, minWidth = 0.001) => {
    const rtrn = _iterHierarchy(root, valueAccessor, childAccessor, minWidth, null, 0, valueAccessor(root), 0.0)
    return rtrn;
}
const _iterHierarchy = (data, valueAccessor, childAccessor, minWidth, parent, depth, totalValue, left) => {
    const width = valueAccessor(data) / totalValue
    if (width < minWidth) {
        return { width: 0 }
    }
    const entry = {
        data,
        x: left,
        y: depth,
        width,
        parent,
        children: []
    }
    if (parent !== null) {
        parent.children.push(entry)
    }
    const children = childAccessor(data)
    if (children && children.length > 0) {
        let pad = left;
        for (var i in children) {
            const child = children[i]
            const childEntry = _iterHierarchy(child, valueAccessor, childAccessor, minWidth, entry, depth + 1, totalValue, pad)
            pad += childEntry.width;
        }
    }
    return entry;
}
export const leafs = (data, childAccessor = (v) => v.children) => {
    const rtrn = []
    const todo = []
    todo.push(data);
    while (todo.length > 0) {
        const target = todo.pop();
        const children = childAccessor(target);
        if (typeof children === "undefined" || children.length == 0) {
            rtrn.push(target)
        } else if (children.length > 0) {
            for (var i in children) {
                const child = children[i]
                todo.push(child)
            }
        }
    }
    return rtrn;
}
export const ancesotors = (data) => {
    const rtrn = []
    let target = data.parent;
    while (target != null) {
        rtrn.push(target)
        target = target.parent;
    }
    return rtrn;
}
export const descendants = (data, childAccessor = (v) => v.children) => {
    const rtrn = []
    const todo = []
    todo.push(data);

    while (todo.length > 0) {
        const target = todo.pop()
        rtrn.push(target)
        const children = childAccessor(target);
        if (children && children.length > 0) {
            for (var i in children) {
                const child = children[i]
                todo.push(child)
            }
        }
    }
    return rtrn;
}
const Frame = ({ onClick = (e) => { }, onDoubleClick = (e) => { }, x, y, width, height, color = "grey", classes, data, children, fade = false }) => (
    <g
        className={clsx(classes.group, { [classes.fade]: fade })}
        onClick={(e) => { e.preventDefault(); onClick(data, e) }}
        onDoubleClick={(e) => { e.preventDefault(); onDoubleClick(data, e) }}
    >
        <rect
            className={classes.rect}
            x={x}
            y={y}

            height={height}
            stroke={"black"}
            fill={color}
            width={width}
        />
        <foreignObject
            x={x}
            y={y}
            width={width}
            height={height}
        >
            <Tooltip title={data.data.method + " : " + Number(data.data._avg).toFixed(3) + 'ms'} style={{ margin: 0 }}>
                <div>
                    <Typography variant="subtitle1" className={classes.text}>{children}</Typography>
                </div>
            </Tooltip>
        </foreignObject>
    </g>
)
const styles = theme => ({
    flame: {
        '& > *:hover': {
          stroke: 'black',
          strokeWidth: 0.5,
          cursor: 'pointer',
        },
      },
      rect: {
        stroke: 'white',
        '& > *:hover': {
          opacity: 0.5,
        },
      },
      fade: {
        opacity: 0.6,
      },
      text: {
        display: 'block',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        fontSize: '12px',
        fontFamily: 'Verdana',
        marginLeft: '4px',
        marginRight: '4px',
        lineHeight: 1.5,
        padding: '0 0 0',
        fontWeight: 400,
        color: 'black',
        textAlign: 'left',
      },
      group: {
    
      },
})
const Flamegraph = ({ data, classes, width = "100%", colors }) => {
    const [zoom, setZoom] = useState(false);
    const onPress = (e) => {
        if (e.key === "Escape") {
            setZoom(false);
        }
    }
    useEffect(() => {
        window.addEventListener('keydown', onPress);
        return () => {
            window.removeEventListener('keydown', onPress);
        }
    }, []);
    if (Object.keys(data).length === 0) {
        return (<div>waiting</div>)
    }

    const hierarchy = zoom ? zoom : data;//buildHierarchy(data, (v) => v.sum, (v) => v.children, 0.001);
    const toRender = descendants(hierarchy);
    const preRender = ancesotors(hierarchy);

    const scale = 1.0 / hierarchy.width
    const shift = hierarchy.x;
    const depth = getDepth(data);
    const frameHeight = 18;
    return (
        <svg
            height={(depth + 1) * frameHeight}
            width={width}
            className={classes.flame}
        >{
                toRender.map((entry, index) => {
                    const x = (100 * scale * (entry.x - shift)) + "%";
                    const y = ((depth - entry.y) * frameHeight);
                    const w = Math.min(100.0, scale * (100 * entry.width)) + "%";
                    const color = colors(entry.data)
                    return (
                        <Frame
                            key={index}
                            x={x}
                            y={y}
                            width={w}
                            height={frameHeight}
                            color={color}
                            classes={classes}
                            onClick={(data, event) => { 
                                
                            }}
                            onDoubleClick={setZoom}
                            data={entry}
                        >
                            {entry.data.method}
                        </Frame>
                    )
                })
            }{
                preRender.map((entry, index) => {
                    const x = (100 * Math.max(0, (entry.x - shift))) + "%";
                    const y = ((depth - entry.y) * frameHeight);
                    const w = Math.min(100.0, scale * (100 * entry.width)) + "%";
                    const color = colors(entry.data)
                    return (
                        <Frame
                            key={index}
                            x={x}
                            y={y}
                            width={w}
                            height={frameHeight}
                            color={color}
                            classes={classes}
                            onClick={setZoom}
                            data={entry}
                            fade={true}
                        >
                            {entry.data.method}
                        </Frame>
                    )
                })
            }
        </svg>
    )


}

export default withStyles(styles)(Flamegraph);