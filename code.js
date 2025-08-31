(function () {
  const app = document.querySelector(".app");
  const socket = io();

  let uname, room;

  // Format message (bold, italic, links)
  function formatMessage(text) {
    return text
      .replace(/\*(.*?)\*/g, "<b>$1</b>")
      .replace(/_(.*?)_/g, "<i>$1</i>")
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
  }

  app.querySelector("#join-user").addEventListener("click", () => {
    const username = app.querySelector("#username").value.trim();
    const roomName = app.querySelector("#room").value.trim();
    if (!username || !roomName) return;

    uname = username;
    room = roomName;

    socket.emit("joinRoom", { username, room });
  });

  socket.on("usernameError", (msg) => {
    alert(msg);
  });

  socket.on("joinedRoom", () => {
    app.querySelector(".join-screen").classList.remove("active");
    app.querySelector(".chat-screen").classList.add("active");
  });

  app.querySelector("#message-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const messageInput = app.querySelector("#message-input");
    const message = messageInput.value.trim();
    if (!message) return;

    renderMessage("my", { username: uname, text: message, time: new Date().toLocaleTimeString() });
    socket.emit("chat", message);
    messageInput.value = "";
  });

  socket.on("update", function (message) {
    renderMessage("update", message);
  });

  socket.on("chat", function (message) {
    renderMessage("other", message);
  });

  app.querySelector("#exit-chat").addEventListener("click", () => {
    window.location.reload();
  });

  function renderMessage(type, message) {
    const msgContainer = app.querySelector(".messages");
    const el = document.createElement("div");

    if (type === "my") {
      el.classList.add("message", "my-message");
      el.innerHTML = `
        <div>
          <div class="name">You [${message.time}]</div>
          <div class="text">${formatMessage(message.text)}</div>
        </div>`;
    } else if (type === "other") {
      el.classList.add("message", "other-message");
      el.innerHTML = `
        <div>
          <div class="name">${message.username} [${message.time}]</div>
          <div class="text">${formatMessage(message.text)}</div>
        </div>`;
    } else if (type === "update") {
      el.classList.add("update");
      el.innerHTML = `<div>${message}</div>`;
    }

    msgContainer.appendChild(el);
    setTimeout(() => {
      msgContainer.scrollTop = msgContainer.scrollHeight;
    }, 50);
  }
})();