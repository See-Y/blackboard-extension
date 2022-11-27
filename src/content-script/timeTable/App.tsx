/// <reference types="chrome" />
/// <reference types="vite-plugin-svgr/client" />

import logo from 'assets/logo.svg'
import React, { useEffect, useRef, useState } from 'react'
import './App.css'
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, styled } from '@mui/material';



function App() {
  const parentRef: any = useRef(null);
  const isParentLoaded = useRef(parentRef.current !== null);
  const [parentTop, setParentTop] = useState<number>(0);
  const [parentLeft, setParentLeft] = useState<number>(0);
  const [parentHeight, setParentHeight] = useState<number>(0);
  const style = { top: parentTop, position: 'absolute', width: "57px" } as React.CSSProperties;
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
  const Grid = styled('div')(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    height: '35px',
    width: '59px',
    borderTop: '1px solid #e3e3e3',
    boxSizing: 'border-box',
  }));
  const Grid2 = styled('div')(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    height: '35px',
    width: '15px',
    borderTop: '1px solid #e3e3e3',
    boxSizing: 'border-box',
  }));

  const RenderTableDay = () => {
    const [lectureList, setLectureList] = useState<any>(null);
    const [isLectureListLoaded, setIsLectureListLoaded] = useState(false);
    const [shapedLectureList, setShapedLectureList] = useState<any>(null);
    useEffect(() => {
      window.chrome.storage.sync.get(['lectureInfo'], (res) => {
        if (res.lectureInfo == undefined && res.lectureInfo == null) {
          alert("블랙보드에 접속하여 강좌정보를 가져오세요!(현재 접속중일경우 새로고침(F5))");
        }
        else {
          var resLecturelist = JSON.parse(res.lectureInfo);
          setLectureList(resLecturelist);
          if (!resLecturelist || (Object.keys(resLecturelist).length === 0 && Object.getPrototypeOf(resLecturelist) === Object.prototype)) {
            alert("블랙보드에 접속하여 강좌정보를 가져오세요!(현재 접속중일경우 새로고침(F5))");
          }
          var colorlist = ["#eff9cc", "#dee8f6", "#ffe9e9", "#ffedda", "#dcf2e9", "#dceef2", "#fff8cc", "#ffe9e9"]
          var l: any[] = [[], [], [], [], []];
          let key: string;
          var i = 0;
          for (key in resLecturelist) {
            let item: any = resLecturelist[key];
            i+=1;
            for (var c = 0; c < 3; c++) {
              if (item["timeplace" + c]) {
                let newItem: any = {};
                newItem["name"] = item["name"];
                newItem["professor"] = item["professor"];
                newItem["time"] = item["time"];
                newItem["link"] = item["link"];
                newItem["color"] = colorlist[i];
                newItem["timeplace"] = item["timeplace" + c];
                l[item["timeplace" + c].day].push(newItem);

              }
            }
          }
          setShapedLectureList(l)
          setIsLectureListLoaded(true);
        }
      })
    }, [])
    return (
      <>
        {isLectureListLoaded && <>
          {[...Array(5)].map((x, i) => {
            return (<BorderedTD>
              {shapedLectureList[i].map((item: any) => {
                const LectureDiv = styled(Box)`
                position: absolute;
                margin-top: ${(item["timeplace"].start - 108) * 840/288 + 'px'}; 
                height: ${(item["timeplace"].end - item["timeplace"].start) * 2.8 + 'px'};
                width: 59px;
                font-family: "맑은 고딕";
                font-size: 10px;
                font-weight: bold;
                background-color: ${item["color"]};
                `;
                
                return (<>
                  <LectureDiv>{item.name}</LectureDiv>
                </>)
              })}
              {[...Array(12)].map((x, i) =>
                <Grid></Grid>
              )}
            </BorderedTD>)
          })}
        </>}
      </>
    )
  }
  return (
    <div ref={(el: any) => {
      const parentTop: number = el?.getBoundingClientRect().top - 140; //35*4 = 140 
      const parentLeft: any = el?.getBoundingClientRect().left;
      const parentHeight: any = el?.getBoundingClientRect().height;
      setParentTop(parentTop);
      setParentLeft(parentLeft);
      setParentHeight(parentHeight);
      console.log(parentTop, parentLeft, parentHeight);
    }}>
      <TableContainer sx={{ height: 440 }}>
        <TableRow sx={{ height: '35px' }}>

          <BorderedTD2>
            {[...Array(12)].map((x, i) =>
              <Grid2>{i + 9}</Grid2>
            )}
          </BorderedTD2>
          <RenderTableDay />
        </TableRow>
        {/* <RenderLectureList /> */}
      </TableContainer>
      {/* <RenderLectureList /> */}
      {/* {parentTop ? <RenderLectureList /> : null} */}


    </div>

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


