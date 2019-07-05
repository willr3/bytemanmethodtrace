import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

import { ThemeProvider } from '@material-ui/styles';
import { createMuiTheme } from '@material-ui/core/styles';

import State from './redux/state';
const data = window.__DATA__;

delete window.__DATA__;

const theme = createMuiTheme();

ReactDOM.render(
    <ThemeProvider theme={theme}>
        <App loaded={new State(data)}/>
    </ThemeProvider>    
, document.getElementById('root'));

