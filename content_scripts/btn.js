const nanoid = (t = 21) =>
  crypto
    .getRandomValues(new Uint8Array(t))
    .reduce(
      (t, e) =>
        (t +=
          (e &= 63) < 36
            ? e.toString(36)
            : e < 62
            ? (e - 26).toString(36).toUpperCase()
            : e > 62
            ? "-"
            : "_"),
      ""
    );

const colors = [
  "c_b65151",
  "c_d53383",
  "c_ba0665",
  "c_de1934",
  "c_bc0f0f",
  "c_670033",
  "c_b06216",
  "c_844b15",
  "c_6f5b27",
  "c_687e34",
  "c_4a831c",
  "c_006400",
  "c_008850",
  "c_0c808b",
  "c_1a78d3",
  "c_0352ea",
  "c_2525bf",
  "c_09367f",
  "c_9e02fe",
  "c_800080",
  "c_5f2782",
  "c_777777",
  "c_52515d",
  "c_222222",
  "c_white"
];

let todos = JSON.parse(localStorage.getItem("todos")) ?? [];


const initializeUI = () => {
  var floatingDiv = HTMLAppender({
    parent: document.body,
    tagName: "div",
    className: "floatDiv",
    eventListener: {
      click: () => {
        popupDiv.style.display =
          popupDiv.style.display === "flex" ? "none" : "flex",
        changeTodoDiv.style.display = "none";
      }
    },
  });

  var flipDiv = HTMLAppender({
    parent: floatingDiv,
    tagName: "div",
    className: "flipDiv",
  })

  var flipFront = HTMLAppender({
    parent: flipDiv,
    tagName: "div",
    className: "flipFront",
  })

  var HeXAText = HTMLAppender({
    parent: flipFront,
    tagName: "p",
    className: "HeXAText",
    innerText: "HeXA",
  })

  var flipBack = HTMLAppender({
    parent: flipDiv,
    tagName: "div",
    className: "flipBack",
  })

  var HeXALogo = HTMLAppender({
    parent: flipBack,
    tagName: "img",
    className: "HeXALogo",
    src: chrome.runtime.getURL("images/HeXA_logo.png"),
    onerror: "this.style.display='none';",
    alt: "",
  });

  var popupDiv = HTMLAppender({
    parent: document.body,
    tagName: "div",
    className: "popupDiv",
    style: {
      display: "none",
    },
  });

  /* -------- */

  var popupNav = HTMLAppender({
    parent: popupDiv,
    tagName: "div",
    className: "popupNav",
  });

  var popupTitle = HTMLAppender({
    parent: popupNav,
    tagName: "span",
    className: "popupTitle",
  });

  setInterval(
    () => (popupTitle.innerText = `HeXA Todo ${dateFormatter()}`),
    1000
  );

  var sortDate = HTMLAppender({
    parent: popupNav,
    tagName: "button",
    className: "sortDate",
    innerText: "Sort by Date",
    eventListener: {
      click: () => {
        todos.sort(function(a, b) {
          return (a.date < b.date) ? -1 : (a.date > b.date) ? 1 : 0;
        });
        localStorage.setItem("todos", JSON.stringify(todos));
        changeTodoDiv.style.display = "none";
        printTodos(assignmentsUl);
      },
    },
  });

  var popupX = HTMLAppender({
    parent: popupNav,
    tagName: "button",
    className: "popupX",
    innerText: "X",
    eventListener: {
      click: () => {
        popupDiv.style.display = "none";
        changeTodoDiv.style.display = "none";
      },
    },
  });

  /* -------- */

  var popupContent = HTMLAppender({
    parent: popupDiv,
    tagName: "div",
    className: "popupContent",
    eventListener: {
      scroll:() => {
        changeColorPopup.style.display = "none";
        changeTodoDiv.style.display = "none";
      }
    }
  });

  var assignmentsDiv = HTMLAppender({
    parent: popupContent,
    tagName: "div",
    className: "assignmentsDiv",
    
  });

  var assignmentsUl = HTMLAppender({
    parent: assignmentsDiv,
    tagName: "ul",
    className: "assignmentsUl",
    
  });

  /* -------- */

  var addTodoDiv = HTMLAppender({
    parent: popupDiv,
    tagName: "div",
    className: "addTodoDiv",
  });

  var addTodoForm = HTMLAppender({
    parent: addTodoDiv,
    tagName: "form",
    id: "addTodoForm",
    className: "addTodoForm",
    autocomplete: "off",
    eventListener: {
      load: () => {},
      submit: (evt) => {
        evt.stopImmediatePropagation();
        evt.stopPropagation();
        evt.preventDefault();

        const todoInput = document.getElementById("todoInput");

        if (!todoInput.value.trim()) return;

        todos.push({
          _id: nanoid(),
          content: todoInput.value,
          date: document.getElementById("dateInput").valueAsNumber - 32_400_000,
          color: document.getElementById("todoColor").value,
          linkcode: ""
        });
        localStorage.setItem("todos", JSON.stringify(todos));
        todoInput.value = "";

        printTodos(assignmentsUl);
      },
    },
  });

  var addTodoInput = HTMLAppender({
    parent: addTodoForm,
    tagName: "input",
    id: "todoInput",
    className: "addTodoInput",
    placeholder: "Add Todo",
  });

  var colorPickerDiv = HTMLAppender({
    parent: addTodoForm,
    tagName: "div",
    className: "colorPickerDiv",
  })
  
  var colorPickerPopup = HTMLAppender({
    parent: colorPickerDiv,
    tagName: "div",
    className: "colorPickerPopup",
  })

  for (const color of colors)
    HTMLAppender({
      parent: colorPickerPopup,
      tagName: "button",
      className: "colorElement " + color,
      type: "button",
      value: color,
      eventListener: {
        click: (evt) => {
          colorPickerBtn.className = `${evt.target.value} colorPickerBtn`
          colorPickerBtn.value = evt.target.value
          colorPickerPopup.style.display = "none"
        }
      }
    })

  var colorPickerBtn = HTMLAppender({
    parent: colorPickerDiv,
    tagName: "button",
    id: "todoColor",
    value: "c_white",
    type: "button",
    className: "colorPickerBtn",
    innerText: "🎨",
    eventListener: {
      click: () => (
        colorPickerPopup.style.display =
          colorPickerPopup.style.display === "flex" ? "none" : "flex")
    }
  })

  const [year, month, day, hour, min] = getDateObj(new Date());

  var todoDateInput = HTMLAppender({
    parent: addTodoForm,
    tagName: "input",
    id: "dateInput",
    className: "todoDateInput",
    type: "datetime-local",
    value: `${year}-${month}-${day}T${hour}:${min}`,
  });

  var addTodoBtn = HTMLAppender({
    parent: addTodoForm,
    tagName: "button",
    className: "addTodoBtn",
    type: "submit",
    innerText: "Add",
  });

  var loadAssignsDiv = HTMLAppender({
    parent: popupDiv,
    tagName: "div",
    className: "loadAssignsDiv",
  });

  var loadAssignsForm = HTMLAppender({
    parent: loadAssignsDiv,
    tagName: "form",
    id: "loadAssignsForm",
    className: "loadAssignsForm",
    autocomplete: "off",
    eventListener: {
      load: () => {},
      submit: (evt) => {
        evt.stopImmediatePropagation();
        evt.stopPropagation();
        evt.preventDefault();
        const fetchUrl = "https://blackboard.unist.ac.kr/webapps/calendar/calendarData/selectedCalendarEvents?start=" + Date.now() + "&end=2147483647000";
        fetch(fetchUrl) 
            .then((response) => response.json())
            .then(function(fetchData) {
                var fetchedAssignsContents = [];
                var fetchedAssignsDates = [];
                var fetchedAssignsColors = [];
                for(var key in fetchData) {
                    var newStartString = fetchData[key]["start"];
                    var newDate = new Date(newStartString);
                    var assignName = fetchData[key]["title"];
                    var link = "";
                    if(fetchData[key]["calendarName"] !== "Personal") {
                      assignName = fetchData[key]["calendarName"] + ": " + assignName;
                      link = fetchData[key]["id"];
                    }
                    const re = new RegExp('[a-zA-Z0-9]{6}');
                    var Todo = {
                        _id : nanoid(),
                        content : assignName,
                        date : newDate.getTime(),
                        color: "c_" + re.exec(fetchData[key]["color"])[0],
                        linkcode: link
                    };
                    fetchedAssignsContents.push(Todo.content);
                    fetchedAssignsDates.push(Todo.date);
                    fetchedAssignsColors.push(Todo.color);
                    var set = true;
                    for(alreadyTodo in todos) {
                      if(todos[alreadyTodo].content == Todo.content && todos[alreadyTodo].date == Todo.date && todos[alreadyTodo].color == Todo.color) {
                        set = false;
                        break;
                      }
                    } // 중복체크
                    if(set)
                      todos.push(Todo);
                }
                var todosTemp = todos;
                for(alreadyTodo in todosTemp) {
                  if(todosTemp[alreadyTodo].linkcode !== "") { // 과제인지 사용자가 직접 추가한거인지 구분
                    var idx = fetchedAssignsContents.indexOf(todosTemp[alreadyTodo].content);
                    if(idx < 0 || (idx >= 0 && (fetchedAssignsDates.indexOf(todosTemp[alreadyTodo].date) < 0 || fetchedAssignsColors.indexOf(todosTemp[alreadyTodo].color) < 0))) // 없어지거나 있는데 시간이 바뀐경우
                      todos = todos.filter((item) => item._id !== todosTemp[alreadyTodo]._id); // 제거
                  }
                }
                localStorage.setItem("todos", JSON.stringify(todos));
                printTodos(assignmentsUl);
            }
        );
      },
    },
  });

  var loadAssignsInput = HTMLAppender({
    parent: loadAssignsForm,
    tagName: "button",
    className: "loadAssignsBtn",
    type: "submit",
    innerText: "Load assigns from BB calendar",
  });

  var changeTodoDiv = HTMLAppender({
    parent: document.body,
    tagName: "div",
    className: "changeTodoDiv",
    id: "changeTodoDiv",
  });

  var changeTodoForm = HTMLAppender({
    parent: changeTodoDiv,
    tagName: "form",
    id: "changeTodoForm",
    className: "changeTodoForm",
    autocomplete: "off",
    eventListener: {
      load: () => {},
      submit: (evt) => {
        evt.stopImmediatePropagation();
        evt.stopPropagation();
        evt.preventDefault();
        const targetId = document.getElementById("nameChangeHidden").value;
        var changeTodo = todos;
        for(assign in changeTodo) {
          if(changeTodo[assign]._id === targetId) {
            changeTodo[assign].content = document.getElementById("nameChange").value;
            changeTodo[assign].date = document.getElementById("dateChange").valueAsNumber - 32_400_000;
            changeTodo[assign].color = document.getElementById("changeColor").value;
          }
        }
        localStorage.setItem("todos", JSON.stringify(changeTodo));
        todos = changeTodo;
        printTodos(assignmentsUl);
        changeColorPopup.style.display = "none";
        changeTodoDiv.style.display = "none";
      },
    },
  });


  var changeTodoInputName = HTMLAppender({
    parent: changeTodoForm,
    tagName: "input",
    id: "nameChange",
    className: "ChangeTodoContent",
    placeholder: "Change..",
  });

  var changeTodoInputNameHidden = HTMLAppender({
    parent: changeTodoForm,
    tagName: "input",
    id: "nameChangeHidden",
    style: {
      display: "none",
    },
  });

  var changeColorDiv = HTMLAppender({
    parent: changeTodoForm,
    tagName: "div",
    className: "colorPickerDiv",
  });

  var changeColorPopup = HTMLAppender({
    parent: changeColorDiv,
    tagName: "div",
    id: "changeColorPopup",
    className: "ChangeColorPopup",
  })

  for (const color of colors)
    HTMLAppender({
      parent: changeColorPopup,
      tagName: "button",
      className: "colorElement " + color,
      type: "button",
      value: color,
      eventListener: {
        click: (evt) => {
          changeColorBtn.className = `${evt.target.value} changeColorBtn`
          changeColorBtn.value = evt.target.value
          changeColorPopup.style.display = "none"
        }
      }
    })

  var changeColorBtn = HTMLAppender({
    parent: changeColorDiv,
    tagName: "button",
    id: "changeColor",
    value: "c_white",
    type: "button",
    className: "changeColorBtn",
    innerText: "🎨",
    eventListener: {
      click: () => (
        changeColorPopup.style.display =
        changeColorPopup.style.display === "flex" ? "none" : "flex")
    }
  });

  var changeTodoInputDate = HTMLAppender({
    parent: changeTodoForm,
    tagName: "input",
    id: "dateChange",
    className: "todoDateChange",
    type: "datetime-local",
  });

  var changeTodoCloseBtn = HTMLAppender({
    parent: changeTodoForm,
    tagName: "button",
    className: "changeTodoBtn_X",
    type: "button",
    innerText: "X",
    eventListener: {
      click: () => {
        changeColorPopup.style.display = "none";
        changeTodoDiv.style.display = "none";
      },
    },
  });

  var changeTodoBtn = HTMLAppender({
    parent: changeTodoForm,
    tagName: "button",
    className: "changeTodoBtn_O",
    type: "submit",
    innerText: "✔",
  });

  printTodos(assignmentsUl);
  setInterval(() => printTodos(assignmentsUl), 1000);
};

const printTodos = (assignmentsUl) => {
  assignmentsUl.innerHTML = "";

  for (const todo of todos) printLi(assignmentsUl, todo);
};

const printLi = (assignmentsUl, todo) => {
  var li = HTMLAppender({
    parent: assignmentsUl,
    tagName: "li",
    className: "assignmentsLi " + todo.color
  });
  
  HTMLAppender({
    parent: li,
    tagName: "button",
    className: todo.linkcode !== "" ? "AssignLink" : "AssignLink EmptyLink",
    innerText: "🔗",
    eventListener: {
      click: () => {
        if(todo.linkcode !== "") {
          var linkurl = "https://blackboard.unist.ac.kr/webapps/calendar/launch/attempt/" + todo.linkcode;
          window.open(linkurl);
        }
      },
    },
  });
  var div = HTMLAppender({
    parent: li,
    tagName: "div",
    className: "todoContents",
    eventListener: {
      dblclick: () => { // 각 과제 열 더블클릭시 이벤트
        // 입력창 설정
        var changeDiv = document.getElementById("changeTodoDiv");
        document.getElementById("nameChange").value = todo.content;
        document.getElementById("nameChangeHidden").value = todo._id; // 바꿀 과목 id 보이지 않는 곳에 저장
        document.getElementById("changeColor").value = todo.color;
        document.getElementById("changeColor").className = todo.color + " changeColorBtn";
        const currentDate = new Date(todo.date);
        document.getElementById("dateChange").value = `${currentDate.getFullYear()}-${("0" + (currentDate.getMonth() + 1)).slice(-2)}-${("0" + currentDate.getDate()).slice(-2)}T${("0" + currentDate.getHours()).slice(-2)}:${("0" + currentDate.getMinutes()).slice(-2)}`;
        changeDiv.style.display = "flex";
        changeDiv.style.position = "fixed";
        changeColorPopup.style.display = "none";
        changeDiv.style.top = li.getBoundingClientRect().top + "px";
        changeDiv.style.left = li.getBoundingClientRect().left + "px";
        changeDiv.style.height = li.getBoundingClientRect().height + "px";
        changeDiv.style.width = li.getBoundingClientRect().width + "px";
      },
    },
  });
  
  HTMLAppender({
    parent: div,
    tagName: "span",
    className: "todoContent",
    innerText: `${todo.content}`,
  });

  HTMLAppender({
    parent: div,
    tagName: "span",
    className: "todoDate",
    innerText: `${dateFormatter(new Date(todo.date))}`,
  });

  var d_day = HTMLAppender({
    parent: li,
    tagName: "span",
    className: "todoD_day",
    innerText: fromNow(todo.date),
  });

  HTMLAppender({
    parent: li,
    tagName: "button",
    className: "todoX",
    innerText: "X",
    eventListener: {
      click: () => {
        todos = todos.filter((item) => item._id !== todo._id);
        localStorage.setItem("todos", JSON.stringify(todos));
        changeColorPopup.style.display = "none";
        changeTodoDiv.style.display = "none";
        printTodos(assignmentsUl);
      },
    },
  });
};

window.addEventListener("resize", () => {
  changeTodoDiv.style.display = "none";
})

const HTMLAppender = (elObj) => {
  const { parent, tagName, style, eventListener, ...filtered } = elObj;
  const el = document.createElement(tagName);

  if (style)
    for (const [key, value] of Object.entries(style)) el.style[key] = value;

  if (eventListener)
    for (const [key, value] of Object.entries(eventListener))
      el.addEventListener(key, value);

  for (const [key, value] of Object.entries(filtered)) el[key] = value;

  parent.appendChild(el);
  return el;
};

const leftPad = (obj, num = 2) => {
  return obj.toString().padStart(num, "0");
};

const dateFormatter = (src = new Date()) => {
  const [year, month, day, hour, min] = getDateObj(src);
  return `${year}-${month}-${day} ${hour}:${min}`;
};

const getDateObj = (src) => {
  const year = leftPad(src.getFullYear(), 4);
  const month = leftPad(src.getMonth() + 1);
  const day = leftPad(src.getDate());
  const hour = leftPad(src.getHours());
  const min = leftPad(src.getMinutes());
  const sec = leftPad(src.getSeconds());

  return [year, month, day, hour, min, sec];
};

const fromNow = (dueDate) => {
  let diff = new Date(dueDate) - Date.now();
  let isOver = false;

  if (diff <= 0) {
    diff = -diff;
    isOver = true;
  }

  const diffDay = Math.floor(diff / (1000 * 60 * 60 * 24));
  const diffHour = leftPad(Math.floor((diff / (1000 * 60 * 60)) % 24));
  const diffMin = leftPad(Math.floor((diff / (1000 * 60)) % 60));
  const diffSec = leftPad(Math.floor((diff / 1000) % 60));

  return (
    `${diffDay} ${diffDay > 1 ? "days" : "day"} ` +
    `${diffHour}:${diffMin}:${diffSec} ` +
    `${isOver ? "over" : "remain"}`
  );
};

initializeUI();
