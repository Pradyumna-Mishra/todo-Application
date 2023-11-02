const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const isMatch = require("date-fns/isMatch");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

let db;

const app = express();
app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server Started On Port 3000`);
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasSearch = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const getResultData = (data) => {
  return {
    id: data.id,
    todo: data.todo,
    priority: data.priority,
    status: data.status,
    category: data.category,
    dueDate: data.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let todosQuery = "";
  let data = null;
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    //3
    case hasPriorityAndStatus(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          todosQuery = `SELECT * FROM todo WHERE priority = '${priority}' AND status = '${status}';`;
          data = await db.all(todosQuery);
          response.send(data.map((eachData) => getResultData(eachData)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //5
    case hasCategoryAndStatus(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          todosQuery = `SELECT * FROM todo WHERE category = '${category}' AND status = '${status}';`;
          data = await db.all(todosQuery);
          response.send(data.map((eachData) => getResultData(eachData)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //7
    case hasCategoryAndPriority(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          todosQuery = `SELECT * FROM todo WHERE category = '${category}' AND priority = '${priority}';`;
          data = await db.all(todosQuery);
          response.send(data.map((eachData) => getResultData(eachData)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategory(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        todosQuery = `SELECT * FROM todo WHERE category = '${category}';`;
        data = await db.all(todosQuery);
        response.send(data.map((eachData) => getResultData(eachData)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasPriority(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        todosQuery = `SELECT * FROM todo WHERE priority = '${priority}';`;
        data = await db.all(todosQuery);
        response.send(data.map((eachData) => getResultData(eachData)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasStatus(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        todosQuery = `SELECT * FROM todo WHERE status = '${status}';`;
        data = await db.all(todosQuery);
        response.send(data.map((eachData) => getResultData(eachData)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case hasSearch(request.query):
      todosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      data = await db.all(todosQuery);
      response.send(data.map((eachData) => getResultData(eachData)));
      break;

    default:
      todosQuery = `SELECT due_date FROM todo;`;
      data = await db.all(todosQuery);
      response.send(data.map((eachData) => getResultData(eachData)));
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodo = `SELECT * FROM todo WHERE id = ${todoId};`;
  const todoItem = await db.get(getTodo);
  response.send(getResultData(todoItem));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  console.log(isMatch(date, "yyyy-MM-dd"));
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    console.log(newDate);
    const getSpecificTodos = `SELECT * FROM todo WHERE due_date = '${newDate}';`;
    const specificTodos = await db.all(getSpecificTodos);
    console.log(getSpecificTodos);
    response.send(specificTodos.map((eachData) => getResultData(eachData)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postTodoQuery = `INSERT INTO todo (id, todo, priority, status, category, due_date) VALUES (${id}, '${todo}', '${priority}', '${status}', '${category}', '${dueDate}');`;
          await db.run(postTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  console.log(todoId);
  console.log(requestBody);
  const previousTodosQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodosData = await db.get(previousTodosQuery);
  const {
    todo = previousTodosData.todo,
    priority = previousTodosData.priority,
    status = previousTodosData.status,
    category = previousTodosData.category,
    dueDate = previousTodosData.dueDate,
  } = request.body;
  let updateTodoQuery;
  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}', due_date='${dueDate}' WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodoQuery = `UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}', due_date='${dueDate}' WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}', due_date='${dueDate}' WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        updateTodoQuery = `UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}', due_date='${dueDate}' WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;

    case requestBody.todo !== undefined:
      updateTodoQuery = `UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}', due_date='${dueDate}' WHERE id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getDeleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(getDeleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
