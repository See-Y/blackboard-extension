/// <reference types="chrome" />
/// <reference types="vite-plugin-svgr/client" />

import logo from 'assets/logo.svg'
import React from 'react'
import './App.css'
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, styled } from '@mui/material';

function App() {
  const BorderedTD = styled(TableCell)`
  width: 57px;


  padding: 0;
  &.MuiTableCell-root {
    border: 1px solid #000;
    font-weight: bold;
    width: 57px;
    height: 35px;
    
  }
`;
const BorderedTD2 = styled(TableCell)`
  width: 15px;

  padding: 0;
  &.MuiTableCell-root {
    border: 1px solid #000;
    font-weight: bold;
    width: 15px;
    height: 35px;
    
  }
`;
  return (
    <>
      <TableContainer sx={{ maxHeight: 440 }}>
        {[...Array(11)].map((x, i) =>
          <TableRow key={i} sx={{height:'35px'}}>
            <BorderedTD2>{i+9}</BorderedTD2>
            <BorderedTD></BorderedTD>
            <BorderedTD></BorderedTD>
            <BorderedTD></BorderedTD>
            <BorderedTD></BorderedTD>
            <BorderedTD></BorderedTD>
          </TableRow>
        )}
      </TableContainer>
      {/* <Box sx={{width:300, height:300, border: '1px solid #d6d6d6'}}>
      <Typography>hello</Typography>
    </Box> */}
    </>
    // <div className="App" >
    //   <header className="App-header">
    //     <p>Hello, World!</p>
    //     <p>I'm a Chrome Extension Content Script!</p>
    //   </header>
    // </div>
  )
}
// const TimeTable = () =>{
//   return(
//     <>
//       <div className="tablehead">
//             <table className="tablehead">
//                 <tbody>
//                     <tr>
//                         <th>
//                             <div className="setting"></div>
//                         </th>
//                         <td>월</td>
//                         <td>화</td>
//                         <td>수</td>
//                         <td>목</td>
//                         <td>금</td>
//                     </tr>
//                 </tbody>
//             </table>
//         </div>
//     </>
//   )
// }

export default App


