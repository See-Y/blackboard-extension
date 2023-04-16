/// <reference types="chrome" />
/// <reference types="vite-plugin-svgr/client" />

import React, { useEffect, useRef, useState } from 'react'
import './App.css'

const HeadHeight = 20;
const TableHeight = 35;
const RenderTableDay = () => {
  const [lectureList, setLectureList] = useState<any>(null);
  const [isLectureListLoaded, setIsLectureListLoaded] = useState(false);
  const [shapedLectureList, setShapedLectureList] = useState<any>(null);
  const [logoURL, setLogoURL] = useState<string>("");
  const loadTimeTable = () => {
    setLogoURL(chrome.runtime.getURL("src/assets/HeXA_logo.png"));
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
          i += 1;
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
  }

  const LectureDiv = (props: any) => {
    const marginTop: number = (props.item["timeplace"].start - (9 * 12)) / 12 * (TableHeight + 2) + (HeadHeight + 3); // minus 9 hour to start from 9 
    // add 2 to consider margin.
    const height: number = (props.item["timeplace"].end - props.item["timeplace"].start) / 12 * (TableHeight + 2);
    const place = props.item["timeplace"].place;
    const link = props.item["link"];
    return (
      <div>
        <div
          id="lectureDiv"
          style={{
            backgroundColor: props.item["color"],
            marginTop: marginTop + 'px',
            height: height + 'px',
          }}
          onClick={() => {
            window.open(link, "_blank");
          }}>
          <span>{props.item["name"]}</span>
          <span id="lecturePlace">{place}</span>
        </div>
      </div>
    )
  }
  useEffect(() => {
    loadTimeTable();
  }, [])
  const dayList = ["월", "화", "수", "목", "금"];
  return (
    <>
      <div style={{
        display: "flex", flexDirection: "row"
      }}>
        {isLectureListLoaded && <>
          <div>
            <div id="lectureGrid"
              style={{
                width: "20px", height: HeadHeight,
              }}>
                <img src={logoURL} 
                style={{
                  width: "20px", height: "20px",
                }}/>
            </div>
            {[...Array(12)].map((x, j) => {
              return (<div id="lectureGrid"
                style={{
                  width: "20px", height: TableHeight,
                }}>
                <span>
                  {j + 9}
                </span>
              </div>)
            })}
          </div>
          {[...Array(5)].map((x, i) => {
            return (<div>
              {shapedLectureList[i].map((item: any) => {
                return (<>
                  <LectureDiv item={item}></LectureDiv>
                </>)
              })}
              <div id="lectureGrid"
                style={{
                  width: "59px", height: HeadHeight,
                }}>
                {dayList[i]}
              </div>
              {[...Array(12)].map(() => {
                return (<div id="lectureGrid"
                  style={{
                    width: "59px", height: TableHeight,
                  }}>
                </div>)
              })}
            </div>)
          })}
        </>}
      </div>
    </>
  )
}
const TimeTable = () => {
  const parentRef: any = useRef(null);
  const isParentLoaded = useRef(parentRef.current !== null);
  const [parentTop, setParentTop] = useState<number>(0);
  const [parentLeft, setParentLeft] = useState<number>(0);
  const [parentHeight, setParentHeight] = useState<number>(0);


  return (
    <div ref={(el: any) => {
      const parentTop: number = el?.getBoundingClientRect().top - 140; //35*4 = 140 
      const parentLeft: any = el?.getBoundingClientRect().left;
      const parentHeight: any = el?.getBoundingClientRect().height;
      setParentTop(parentTop);
      setParentLeft(parentLeft);
      setParentHeight(parentHeight);
    }}
      id="parent"
      style={{
        height: "440px",
        width: "100%",

      }}>
      <RenderTableDay />
    </div>

  )
}

export default TimeTable;

