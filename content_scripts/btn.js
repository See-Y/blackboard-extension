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
    className: "assignmentsLi",
  });

  var span = HTMLAppender({
    parent: li,
    tagName: "span",
    className: "todoContent",
    innerText: `${todo.content}\n${dateFormatter(new Date(todo.date))}`,
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
