import React, { useState, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/styles';
import Button from '@material-ui/core/Button'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import {
    usePopupState,
    bindTrigger,
    bindMenu,
} from 'material-ui-popup-state/hooks'

import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';

const styles = theme => ({

    root: {
        flexGrow: 0,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: 320,
        maxHeight: '100vh',
        minHeight: '100vh',
        minWidth: 180,
        backgroundColor: 'white',
        borderRight: 'solid 1px #dadce0',
    },
    toolbar: {
        flexGrow: 0,
        display: 'flex',
        borderBottom: 'solid 1px #dadce0',
    },
    list: {
        flexGrow: 1,
        width: '100%',
        maxWidth: 320,
        minWidth: 180,
        overflowY: 'auto',
    },
    sortButton: {
        marginLeft: 'auto',
        '&:hover':{
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
        }
    }
})

const ListColumn = ({ title = "ListColumn", classes, data = [], sortOptions = {}, children }) => {
    const [direction, setDirection] = useState('asc')
    const [sortBy, setSortBy] = useState(false)
    const popupState = usePopupState({ variant: 'popover', popupId: 'listColumn' })
    const sortedKey = sortBy ? sortOptions[sortBy] : false;
    if (sortBy) {
        data.sort((a, b) => a[sortedKey] - b[sortedKey])
        if(direction === 'desc'){
            data.reverse();
        }
    }
    return (
        <div className={classes.root}>
            <Toolbar className={classes.toolbar} color="default">                
                <span>{title}</span>
                <Button className={classes.sortButton} {...bindTrigger(popupState)}>
                    {sortBy ? (direction === "asc" ? (<ArrowUpwardIcon/>) : (<ArrowDownwardIcon/>)) : undefined}
                    {sortBy || 'sort'}
                </Button>
                <Menu {...bindMenu(popupState)}>
                {Object.keys(sortOptions).map((key,optionIndex)=>{
                    const sortKey = sortOptions[key]
                    return (
                        <MenuItem
                            
                            key={sortKey}
                            onClick={(e)=>{
                                if(key===sortBy){
                                    setDirection(direction==="asc" ? "desc" : "asc")
                                }else{
                                    setSortBy(key)
                                    setDirection("desc");//default to descending because that's what I tend to want to see
                                }
                                popupState.close(e);
                            }}
                        >
                        {key === sortBy ? 
                            (<ListItemIcon>{
                                direction === "asc" ? (<ArrowUpwardIcon/>) : (<ArrowDownwardIcon/>)
                            }</ListItemIcon>) 
                            : undefined
                        }
                            <ListItemText
                                inset={sortBy && key!==sortBy}
                            >{key}</ListItemText>
                        </MenuItem>
                    )
                })}
                </Menu>
            </Toolbar>
            <List className={classes.list}>
                    {data.map(children)}
                </List>
        </div>
            )
        }
ListColumn.propTypes = {
                children: PropTypes.func.isRequired,
          };
export default withStyles(styles)(ListColumn);