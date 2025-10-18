// Storage keys and state

let classes = JSON.parse(localStorage.getItem("classes")) || {};

let currentClass = Object.keys(classes)[0] || null;

const classDropdown = document.getElementById("classDropdown");

const recordClassDropdown = document.getElementById("recordClassDropdown");

const grid = document.getElementById("studentGrid");

const dateTimeDiv = document.getElementById("dateTime");

const calendarGrid = document.getElementById("calendarGrid");

const monthYear = document.getElementById("monthYear");

const recordDetails = document.getElementById("recordDetails");

const classList = document.getElementById("classList");

let displayMonth = new Date().getMonth();

let displayYear  = new Date().getFullYear();

// Helpers

function isoDate(y,m,d){

  const mm = (m+1).toString().padStart(2,"0");

  const dd = d.toString().padStart(2,"0");

  return `${y}-${mm}-${dd}`;

}

function saveClasses(){ localStorage.setItem("classes", JSON.stringify(classes)); }

// UI initialization & syncing

function refreshClassDropdowns(){

  [classDropdown, recordClassDropdown].forEach(drop=>{

    drop.innerHTML = "";

    Object.keys(classes).forEach(c=>{

      const o = document.createElement("option");

      o.value = c; o.textContent = c;

      drop.appendChild(o);

    });

  });

  const first = Object.keys(classes)[0] || null;

  if(!currentClass) currentClass = first;

  if(currentClass && classes[currentClass]){

    classDropdown.value = currentClass;

    recordClassDropdown.value = currentClass;

  } else {

    currentClass = first;

    classDropdown.value = first;

    recordClassDropdown.value = first;

  }

  renderStudentGrid();

  renderCalendar();

  loadClassList();

}

// Student grid (default = Present)

function renderStudentGrid(){

  grid.innerHTML = "";

  if(!currentClass || !classes[currentClass]) return;

  classes[currentClass].forEach(name=>{

    const btn = document.createElement("button");

    btn.textContent = name;

    btn.className = "student present";

    btn.onclick = ()=> cycleStatus(btn);

    grid.appendChild(btn);

  });

}

function cycleStatus(btn){

  if(btn.classList.contains("present")){

    btn.className = "student absent";

  } else if(btn.classList.contains("absent")){

    btn.className = "student excused";

  } else {

    btn.className = "student present";

  }

}

// Date/time display

function updateDateTime(){

  const now = new Date();

  dateTimeDiv.innerHTML = `<h3>${now.toLocaleString()}</h3>`;

}

setInterval(updateDateTime, 1000);

updateDateTime();

// Submit attendance

document.getElementById("submit").onclick = ()=>{

  if(!currentClass) return alert("Select a class first.");

  const data = {};

  document.querySelectorAll(".student").forEach(btn=>{

    const name = btn.textContent;

    if(btn.classList.contains("present")) data[name] = "Present";

    else if(btn.classList.contains("absent")) data[name] = "Absent";

    else data[name] = "Excused";

  });

  const now = new Date();

  const key = `attendance_${currentClass}_${isoDate(now.getFullYear(), now.getMonth(), now.getDate())}`;

  localStorage.setItem(key, JSON.stringify(data));

  alert(`Attendance saved for ${currentClass} (${key.replace(`attendance_${currentClass}_`,"")})`);

  renderCalendar();

};

// Clear selection resets to default Present

document.getElementById("clearSelection").onclick = ()=> renderStudentGrid();

// Tab switching

document.getElementById("tabAttendance").onclick = ()=> switchTab("attendance");

document.getElementById("tabRecords").onclick = ()=> switchTab("records");

document.getElementById("tabClasses").onclick = ()=> switchTab("classes");

function switchTab(tab){

  document.getElementById("attendancePage").style.display = tab==="attendance" ? "block" : "none";

  document.getElementById("recordsPage").style.display = tab==="records" ? "block" : "none";

  document.getElementById("classesPage").style.display = tab==="classes" ? "block" : "none";

  document.querySelectorAll(".tabs button").forEach(b=>b.classList.remove("active"));

  document.getElementById("tab"+tab[0].toUpperCase()+tab.slice(1)).classList.add("active");

  if(tab==="records") {

    if(recordClassDropdown.value) currentClass = recordClassDropdown.value;

    renderCalendar();

  }

  if(tab==="classes") loadClassList();

}

// Calendar (monthly grid)

document.getElementById("prevMonth").onclick = ()=> { displayMonth--; if(displayMonth<0){displayMonth=11; displayYear--;} renderCalendar(); };

document.getElementById("nextMonth").onclick = ()=> { displayMonth++; if(displayMonth>11){displayMonth=0; displayYear++;} renderCalendar(); };

function renderCalendar(){

  calendarGrid.innerHTML = "";

  recordDetails.innerHTML = "";

  if(!currentClass){ calendarGrid.innerHTML = "<p style='color:#666'>No class selected.</p>"; return; }

  const firstDay = new Date(displayYear, displayMonth, 1).getDay();

  const daysInMonth = new Date(displayYear, displayMonth+1, 0).getDate();

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  monthYear.textContent = `${monthNames[displayMonth]} ${displayYear}`;

  // week headers

  const daysHeader = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  daysHeader.forEach(dh=>{

    const header = document.createElement("div");

    header.className = "calendar-cell";

    header.innerHTML = `<div class="daynum" style="font-weight:700">${dh}</div>`;

    calendarGrid.appendChild(header);

  });

  // empty cells before first day

  for(let i=0;i<firstDay;i++){

    const empty = document.createElement("div");

    empty.className = "calendar-cell empty";

    calendarGrid.appendChild(empty);

  }

  // days

  for(let day=1; day<=daysInMonth; day++){

    const cell = document.createElement("div");

    cell.className = "calendar-cell";

    cell.innerHTML = `<div class="daynum">${day}</div><div class="mini"></div>`;

    const keyDate = isoDate(displayYear, displayMonth, day);

    const key = `attendance_${currentClass}_${keyDate}`;

    if(localStorage.getItem(key)) cell.classList.add("has-record");

    cell.onclick = ()=> {

      showRecord(keyDate);

    };

    calendarGrid.appendChild(cell);

  }

}

// show details for a date

function showRecord(dateIso){

  recordDetails.innerHTML = "";

  const key = `attendance_${currentClass}_${dateIso}`;

  const raw = localStorage.getItem(key);

  if(!raw){ recordDetails.innerHTML = `<p>No record for ${currentClass} on ${dateIso}</p>`; return; }

  const data = JSON.parse(raw);

  let html = `<h3>${currentClass} - ${dateIso}</h3><ul>`;

  for(const [name,status] of Object.entries(data)){

    const color = status==="Present" ? "green" : status==="Excused" ? "blue" : "red";

    html += `<li style="color:${color}"><b>${name}</b>: ${status}</li>`;

  }

  html += "</ul>";

  recordDetails.innerHTML = html;

}

// Class manager UI

document.getElementById("openAddClass").onclick = ()=> openModal();

document.getElementById("addClassQuick").onclick = ()=> openModal();

function loadClassList(){

  classList.innerHTML = "";

  Object.keys(classes).forEach(c=>{

    const li = document.createElement("li");

    const span = document.createElement("span");

    span.textContent = `${c} (${classes[c].length} students)`;

    const actions = document.createElement("div");

    const editBtn = document.createElement("button"); editBtn.textContent = "Edit";

    editBtn.onclick = ()=> editClass(c);

    const delBtn = document.createElement("button"); delBtn.textContent = "Delete";

    delBtn.style.background = "#c62828";

    delBtn.onclick = ()=> deleteClass(c);

    actions.appendChild(editBtn);

    actions.appendChild(delBtn);

    li.appendChild(span);

    li.appendChild(actions);

    classList.appendChild(li);

  });

}

function openModal(name=null){

  document.getElementById("modal").style.display = "flex";

  document.getElementById("modalTitle").textContent = name ? "Edit Class" : "Add Class";

  if(name){

    document.getElementById("classNameInput").value = name;

    document.getElementById("studentNamesInput").value = classes[name].join(", ");

    // remove old while editing (will re-add on save)

    delete classes[name]; saveClasses();

  } else {

    document.getElementById("classNameInput").value = "";

    document.getElementById("studentNamesInput").value = "";

  }

}

document.getElementById("cancelClassBtn").onclick = ()=> {

  document.getElementById("modal").style.display = "none";

  refreshClassDropdowns();

};

document.getElementById("saveClassBtn").onclick = ()=>{

  const name = document.getElementById("classNameInput").value.trim();

  const students = document.getElementById("studentNamesInput").value.split(",").map(s=>s.trim()).filter(Boolean);

  if(!name || students.length===0) return alert("Enter class name and at least one student.");

  classes[name] = students;

  saveClasses();

  document.getElementById("modal").style.display = "none";

  currentClass = name;

  refreshClassDropdowns();

};

// edit/delete functions

function editClass(name){

  openModal(name);

}

function deleteClass(name){

  if(!confirm(`Delete class ${name}? This will NOT remove attendance records.`)) return;

  delete classes[name];

  saveClasses();

  if(currentClass===name) currentClass = Object.keys(classes)[0] || null;

  refreshClassDropdowns();

}

// dropdown sync

classDropdown.onchange = ()=> {

  currentClass = classDropdown.value;

  recordClassDropdown.value = currentClass;

  renderStudentGrid();

};

recordClassDropdown.onchange = ()=> {

  if(recordClassDropdown.value){

    currentClass = recordClassDropdown.value;

    classDropdown.value = currentClass;

    renderStudentGrid();

    renderCalendar();

  }

};

// init

refreshClassDropdowns();

renderCalendar();

updateDateTime();

loadClassList();