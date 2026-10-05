const stationData = {
  order: {
    title: "Order Station",
    description: "Read the ticket, choose the cup size, then send it to blending.",
    step: 1,
    action: "Send to Blend Station"
  },
  blend: {
    title: "Blend Station",
    description: "Pick the shake base and syrup, then blend to the right consistency.",
    step: 2,
    action: "Send to Topping Station"
  },
  top: {
    title: "Topping Station",
    description: "Finish the shake with whipped cream, drizzle, and toppings.",
    step: 3,
    action: "Send to Serve Station"
  },
  serve: {
    title: "Serve Station",
    description: "Double-check the ticket and hand the finished shake to the customer.",
    step: 4,
    action: "Serve Order"
  }
};

const tabs = document.querySelectorAll(".station-tab");
const tickets = document.querySelectorAll(".ticket");
const options = document.querySelectorAll(".option");
const flavors = document.querySelectorAll(".flavor");
const title = document.getElementById("stationTitle");
const description = document.getElementById("stationDescription");
const step = document.getElementById("stepNumber");
const nextButton = document.getElementById("nextButton");

function setStation(id) {
  const station = stationData[id];
  if (!station) return;

  tabs.forEach(tab => tab.classList.toggle("active", tab.dataset.station === id));
  title.textContent = station.title;
  description.textContent = station.description;
  step.textContent = station.step;
  nextButton.textContent = station.action;
}

tabs.forEach(tab => {
  tab.addEventListener("click", () => setStation(tab.dataset.station));
});

tickets.forEach(ticket => {
  ticket.addEventListener("click", () => {
    tickets.forEach(item => item.classList.remove("active"));
    ticket.classList.add("active");
  });
});

options.forEach(option => {
  option.addEventListener("click", () => {
    option.parentElement.querySelectorAll(".option").forEach(item => item.classList.remove("active"));
    option.classList.add("active");
  });
});

flavors.forEach(flavor => {
  flavor.addEventListener("click", () => {
    flavors.forEach(item => item.classList.remove("active"));
    flavor.classList.add("active");

    const fill = document.querySelector(".shake-fill");
    if (flavor.classList.contains("chocolate")) {
      fill.style.background = "linear-gradient(180deg,#8e6049,#6e4433)";
    } else if (flavor.classList.contains("strawberry")) {
      fill.style.background = "linear-gradient(180deg,#ef9eb8,#e47b9e)";
    } else {
      fill.style.background = "linear-gradient(180deg,#f5e7c4,#e8d29f)";
    }
  });
});

nextButton.addEventListener("click", () => {
  const active = document.querySelector(".station-tab.active");
  const order = ["order", "blend", "top", "serve"];
  const currentIndex = order.indexOf(active.dataset.station);

  if (currentIndex < order.length - 1) {
    setStation(order[currentIndex + 1]);
  } else {
    nextButton.textContent = "Order Served";
    nextButton.disabled = true;
    nextButton.style.opacity = ".65";
  }
});
