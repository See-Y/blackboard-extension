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
  "white",
  "red",
  "pink",
  "lime",
  "yellow",
  "amber",
  "orange",
  "deep-orange",
  "green",
  "light-green",
  "teal",
  "cyan",
  "blue",
  "light-blue",
  "indigo",
  "purple",
  "deep-purple",
];

let todos = JSON.parse(localStorage.getItem("todos")) ?? [];

const initializeUI = () => {
  var floatingDiv = HTMLAppender({
    parent: document.body,
    tagName: "div",
    className: "floatDiv",
  });

  var floatBtn = HTMLAppender({
    parent: floatingDiv,
    tagName: "button",
    className: "floatBtn",
    innerText: "HeXA",
    eventListener: {
      click: () =>
        (popupDiv.style.display =
          popupDiv.style.display === "flex" ? "none" : "flex"),
    },
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
        console.log(todos);
        todos.sort(function(a, b) {
          return (a.date < b.date) ? -1 : (a.date > b.date) ? 1 : 0;
        });
        console.log(todos);
        localStorage.setItem("todos", JSON.stringify(todos));
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
      },
    },
  });

  /* -------- */

  var popupContent = HTMLAppender({
    parent: popupDiv,
    tagName: "div",
    className: "popupContent",
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

  var addColorSelect = HTMLAppender({
    parent: addTodoForm,
    tagName: "select",
    id: "todoColor",
    className: "addTodoColor",
    placeholder: "Color",
    eventListener: {
      change: (evt) => {
        addTodoInput.className = `${evt.target.value} addTodoInput`;
      },
    },
  });

  for (const color of colors)
    HTMLAppender({
      parent: addColorSelect,
      tagName: "option",
      value: color,
      innerText: color,
    });

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
        console.log(fetchUrl);
        fetch(fetchUrl) 
            .then((response) => response.json())
            .then(function(fetchData) {
                var fetchedAssignsContents = [];
                var fetchedAssignsDates = [];
                for(var key in fetchData) {
                    var newStartString = fetchData[key]["start"];
                    var newDate = new Date(newStartString);
                    var assignName = fetchData[key]["title"];
                    if(fetchData[key]["calendarName"] !== "Personal")
                      assignName = fetchData[key]["calendarName"] + ": " + assignName;
                    var Todo = {
                        _id : nanoid(),
                        content : assignName,
                        date : newDate.getTime(),
                        color: fetchData[key]["color"],
                        linkcode: fetchData[key]["id"]
                    };
                    fetchedAssignsContents.push(Todo.content);
                    fetchedAssignsDates.push(Todo.date);
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
                  if(colors.indexOf(todosTemp[alreadyTodo].color) < 0) { // 과제인지 사용자가 직접 추가한거인지 구분 (색상 코드명 활용)
                    var idx = fetchedAssignsContents.indexOf(todosTemp[alreadyTodo].content);
                    if(idx < 0 || (idx >= 0 && fetchedAssignsDates.indexOf(todosTemp[alreadyTodo].date) < 0)) { // 없어지거나 있는데 시간이 바뀐경우
                      console.log(todosTemp[alreadyTodo]._id);
                      todos = todos.filter((item) => item._id !== todosTemp[alreadyTodo]._id); // 제거
                    }
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
    parent: assignmentsDiv ,
    tagName: "div",
    className: "changeTodoDiv",
    id: "changeTodoDiv",
    style: {
      display:"none",
      "z-index":99999,
      background:"black"
    },
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
        console.log(todos);
        for(assign in changeTodo) {
          console.log(changeTodo[assign]);
          if(changeTodo[assign]._id === targetId) {
            changeTodo[assign].content = document.getElementById("nameChange").value;
            changeTodo[assign].date = document.getElementById("dateChange").valueAsNumber - 32_400_000;
            changeTodo[assign].color = document.getElementById("colorChange").value;
          }
        }
        localStorage.setItem("todos", JSON.stringify(changeTodo));
        todos = changeTodo;
        printTodos(assignmentsUl);
        changeTodoDiv.style.display = "none";
      },
    },
  });

  var changeTodoInputName = HTMLAppender({
    parent: changeTodoForm,
    tagName: "input",
    id: "nameChange",
    className: "ChangeTodoName",
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

  var changeColorSelect = HTMLAppender({
    parent: changeTodoForm,
    tagName: "select",
    id: "colorChange",
    className: "ChangeTodoColor",
    placeholder: "Color",
    eventListener: {
      change: (evt) => {
        console.log(evt.target.value);
        changeTodoInputName.className = `${evt.target.value} ChangeTodoName`;
      },
    },
  });

  for (const color of colors)
    HTMLAppender({
      parent: changeColorSelect,
      tagName: "option",
      value: color,
      innerText: color,
    });

  var changeTodoInputDate = HTMLAppender({
    parent: changeTodoForm,
    tagName: "input",
    id: "dateChange",
    className: "TodoDateChange",
    type: "datetime-local",
  });

  var changeTodoCloseBtn = HTMLAppender({
    parent: changeTodoForm,
    tagName: "button",
    className: "ChangeTodoBtn",
    type: "button",
    innerText: "X",
    eventListener: {
      click: () => {
        changeTodoDiv.style.display = "none";
      },
    },
  });

  var changeTodoBtn = HTMLAppender({
    parent: changeTodoForm,
    tagName: "button",
    className: "ChangeTodoBtn",
    type: "submit",
    innerText: "O",
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
    className: (colors.indexOf(todo.color) < 0 ? "assignmentsLi" : "assignmentsLi " + todo.color), // 과제면 color 등록 안함 (색상코드 사용)
    style: { 
      background: (colors.indexOf(todo.color) < 0 ? todo.color : ""), // 과제면 color 이걸로 등록함
      color: (colors.indexOf(todo.color) < 0 ? "white" : ""),
    },
    eventListener: {
      dblclick: () => { // 각 과제 열 더블클릭시 이벤트
        // 입력창 설정
        console.log(li.offsetTop);
        console.log(li.getBoundingClientRect().top);
        var changeDiv = document.getElementById("changeTodoDiv");
        changeDiv.style.top = li.getBoundingClientRect().top + "px";
        console.log(changeDiv);
        document.getElementById("nameChange").value = todo.content;
        document.getElementById("nameChangeHidden").value = todo._id; // 바꿀 과목 id 보이지 않는 곳에 저장
        if(colors.indexOf(todo.color) >= 0) {
          document.getElementById("colorChange").value = todo.color;
          document.getElementById("nameChange").className = "ChangeTodoName " + todo.color;
        }
        else {
          document.getElementById("colorChange").value = "white";
          document.getElementById("nameChange").className = "ChangeTodoName " + "white";
        }
        const currentDate = new Date(todo.date);
        document.getElementById("dateChange").value = `${currentDate.getFullYear()}-${("0" + (currentDate.getMonth() + 1)).slice(-2)}-${("0" + currentDate.getDate()).slice(-2)}T${("0" + currentDate.getHours()).slice(-2)}:${("0" + currentDate.getMinutes()).slice(-2)}`;
        changeDiv.style.display = "flex";
        changeDiv.style.position = "fixed";
        changeDiv.style.height = li.getBoundingClientRect().height + "px";
      },
    },
  });

  var div = HTMLAppender({
    parent: li,
    tagName: "div",
    className: "todoContents",
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
        printTodos(assignmentsUl);
      },
    },
  });

  HTMLAppender({
    parent: li,
    tagName: "button",
    className: "assignLink",
    innerText: "Link",
    eventListener: {
      click: () => {
        if(todo.linkcode !== "") {
          console.log(todo.linkcode);
          var linkurl = "https://blackboard.unist.ac.kr/webapps/calendar/launch/attempt/" + todo.linkcode;
          window.open(linkurl);
        }
      },
    },
  });
};

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
