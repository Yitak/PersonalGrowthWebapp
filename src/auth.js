import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, setPersistence, browserSessionPersistence, inMemoryPersistence, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js';
import { getDatabase, ref as refD, set, child, get, update, remove } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js';
import { getStorage, ref as refS, uploadBytes, uploadBytesResumable, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js'


const firebaseConfig = {
    apiKey: "AIzaSyBu4cNzPSMcjEC7yKHZqHXwBQpd_wyAFVY",
    authDomain: "personal-growth-and-goals.firebaseapp.com",
    projectId: "personal-growth-and-goals",
    storageBucket: "personal-growth-and-goals.appspot.com",
    messagingSenderId: "1052991863987",
    appId: "1:1052991863987:web:0c92c80ef42225d7a004c6",
    measurementId: "G-LQZ95Y8KE1"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const database = getDatabase(firebaseApp);

// Firebase connection
onAuthStateChanged(auth, (user) => {
    if (user) {
        SignInSignUpBox.style.display = "none";
        memberPageBox.style.display = "flex";

        var userUID = user.uid;
        useruid = userUID;

        READ_USER_SETTINGS(userUID);
        READ_GOALS_FROM_DATABASE(userUID);

        saveUserSettingsButton.addEventListener("click", () => { UPDATE_USER_SETTINGS(userUID, usernameField.value); });

        createNewGoalButton.addEventListener("click", () => {
            goalEditNameField.value = "";
            goalTagField.value = "";
            GET_GOAL_TAGS(userUID);
            toggleGoalEditBox(true, "creation");
        });

        saveGoalEditButton.addEventListener("click", () => {
            if (goalEditBox.classList.contains("creation-mode")) {
                WRITE_GOAL_TO_DATABASE(userUID, goalEditNameField.value, goalTagField.value);
            } else {
                UPDATE_GOAL_TO_DATABASE(userUID, goalEditNameField.value, selectedGoalID, "", goalEditProgressField.value, goalEditProgressTotalField.value, goalTagField.value);
            }
        });

        removeGoalButton.addEventListener("click", () => {
            if (CONFIRM_ACTION_CONSENT("Are you sure you want to remove this goal?")) {
                REMOVE_GOAL_FROM_DATABASE(userUID, selectedGoalID); 
            }
        });

        resetGoalsButton.addEventListener("click", () => {
            if (CONFIRM_ACTION_CONSENT("Are you sure you want to reset all of today goals progress?")) {
                RESET_TODAY_GOALS(userUID);
            }
        });

        moreWeeklyStatisticsButtons.forEach(moreWeeklyStatisticsButton => {
            moreWeeklyStatisticsButton.addEventListener("click", () => {
                toggleMoreDetailedStatisticsView(true);
                if (moreWeeklyStatisticsButton.classList.contains("week")) {
                    expandChartViewBoxTitle.textContent = "Weekly";
                    GET_GOALS_MORE_DETAILED_STATISTICS(userUID, selectedDate.textContent, "week");
                } else {
                    expandChartViewBoxTitle.textContent = "Monthly";
                    GET_GOALS_MORE_DETAILED_STATISTICS(userUID, selectedDate.textContent, "month");
                }
            });
        });

    } else {
        SignInSignUpBox.style.display = "flex";
        memberPageBox.style.display = "none";
    }
});




// LOGIN / SIGNUP / SIGNOUT

const memberPageBox = document.querySelector('.after-auth-box');

const SignInSignUpBox = document.querySelector('.before-auth-box');
const signinEmailField = document.querySelector('.signin-email');
const signinPasswordField = document.querySelector('.signin-password');
const signupEmailField = document.querySelector('.signup-email');
const signupPasswordField = document.querySelector('.signup-password');
const signinSubmitButton = document.querySelector('.signin-submit');
const signupSubmitButton = document.querySelector('.signup-submit');
const signoutButton = document.querySelector('.signoutButton');

const clearAllSignInSignUpInputField = function () {
    signinEmailField.value = "";
    signinPasswordField.value = "";
    signupEmailField.value = "";
    signupPasswordField.value = "";
    signinSubmitButton.value = "";
    signupSubmitButton.value = "";
};

const deselectButtonsOnGoalsReset = function () {
    const taskCompletionButtonIcons = document.querySelectorAll('.taskButton.completionButton i');
    taskCompletionButtonIcons.forEach(taskCompletionButtonIcon => {
        taskCompletionButtonIcon.className = "bx bx-circle";
    });
}

const validateEmail = function (emailAddress) {
    const emailRegex = /^([a-z\d.-]+)@([a-z\d-]+)\.([a-z]{2,3})(\.[a-z]{2,3})?$/;
    if (!emailAddress.match(emailRegex)) {
        if (emailAddress != "") {
            alert("Wrong email address format!");
        } else {
            alert("Email address field cannot be empty!");
            
        }
        return false;
    } else {
        return true
    }
};

const validatePassword = function (password) {
    if (password == "") {
        alert("Password is required!");
        return false;
    } else {
        return true;
    }
};

const LOGIN = function () {
    signInWithEmailAndPassword(auth, signinEmailField.value, signinPasswordField.value).then((userCredential) => {
        const user = userCredential.user;
        clearAllSignInSignUpInputField();
        alert("Login successfully.");
    })
    .catch((error) => {
        alert(error.message);
    });    
};

const SIGNUP = function () {
    if (validateEmail(signupEmailField.value) && validatePassword(signupPasswordField.value)) {
        createUserWithEmailAndPassword(auth, signupEmailField.value, signupPasswordField.value)
            .then((userCredential) => {
                const user = userCredential.user;
                const userData = {
                    email_address: signupEmailField.value,
                    password: signupPasswordField.value,
                    last_login: Date.now()
                }
                set(refD(database, 'users/' + user.uid), userData);
            })
            .then(() => {
                clearAllSignInSignUpInputField();
                alert('Account created!');
            })
            .catch((error) => {
                alert(error.message);
            });
    }
};

const SIGNOUT = function () {
    signOut(auth)
        .then(() => {
            localStorage.clear();
            location.reload();
            alert('Signed out successfully.');
        })
        .catch((error) => {
            alert(error.message);
        });
};

// Login & Sign up functionality
signinSubmitButton.addEventListener("click", () => { LOGIN(); });
signupSubmitButton.addEventListener("click", () => { SIGNUP(); });
signoutButton.addEventListener("click", () => { SIGNOUT(); });




// MEMBER PAGE VIEW

var useruid;

// User Settings

const renameButton = document.querySelector('.renameButton');
const userSettingsBox = document.querySelector('.user-settings-box');
const username = document.querySelector('.username');
const usernameField = document.querySelector('.username-field');
const saveUserSettingsButton = document.querySelector('.saveUserSettingsButton');
const cancelUserSettingsButton = document.querySelector('.cancelUserSettingsButton');

const toggleUserSettingsBox = function (isDisplayed) {
    if (isDisplayed) {
        userSettingsBox.classList.remove("hidden");
    } else {
        usernameField.value = "";
        userSettingsBox.classList.add("hidden");
    }
}

// UPDATE USER SETTINGS
const UPDATE_USER_SETTINGS = function (userUID, name) {
    if (name != "") {
        var modifiedName = name.trim();
        var userInfo = { "username": modifiedName };
        update(refD(database, `users/${userUID}/`), userInfo).then(() => {
            username.textContent = modifiedName;
            toggleUserSettingsBox(false);
        }).catch((error) => { alert(error.message); });
    }
};

// READ USER SETTINGS
const READ_USER_SETTINGS = function (userUID) {
    const userInfoRef = refD(database);
    get(child(userInfoRef, `users/${userUID}/`)).then((snapshot) => {
        if (snapshot.exists()) {
            username.textContent = snapshot.val().username ? snapshot.val().username : "user";
        }
    });
};

renameButton.addEventListener("click", () => { toggleUserSettingsBox(true); });
cancelUserSettingsButton.addEventListener("click", () => { toggleUserSettingsBox(false); });


// Calendar

const currentTimeRange = document.querySelector('.current-time-range');
const days = document.querySelector('.days');
const calendarControlButtons = document.querySelectorAll('.calendar-control-container i');
const todayButton = document.querySelector('.todayButton');

let
    currentDate = new Date(),
    currentDay = currentDate.getDate(),
    currentMonth = currentDate.getMonth(),
    currentYear = currentDate.getFullYear();

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const toggleGoalEditContainer = function (day, month, year) {
    selectedDate.textContent = `${day} ${month} ${year}`;
    if (selectedDate.textContent != todayDate) {
        taskContainer.classList.add("hidden");
        resetGoalsButton.disabled = true;
        createNewGoalButton.disabled = true;
    } else {
        taskContainer.classList.remove("hidden");
        oldTaskContainer.classList.add("hidden");
        resetGoalsButton.disabled = false;
        createNewGoalButton.disabled = false;
    }
};

const rendarCalendar = function () {
    let firstDateOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    let lastDateOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let lastDayOfMonth = new Date(currentYear, currentMonth, lastDateOfMonth).getDay();
    let lastDateOfLastMonth = new Date(currentYear, currentMonth, 0).getDate();
    let dayElementTag = "";
    for(let i = firstDateOfMonth; i > 0; i--) {
        dayElementTag += `<li class="inactive">${lastDateOfLastMonth - i + 1}</li>`;
    }
    for (let i = 1; i <= lastDateOfMonth; i++) {
        let isToday = i == currentDate.getDate() && currentMonth == new Date().getMonth() && currentYear == new Date().getFullYear() ? "selectable active" : "selectable";
        dayElementTag += `<li class="${isToday}">${i}</li>`;
    }
    for (let i = lastDayOfMonth; i < 6; i++) {
        dayElementTag += `<li class="inactive">${i - lastDayOfMonth + 1}</li>`;
    }
    currentTimeRange.textContent = `${months[currentMonth]} ${currentYear}`;
    days.innerHTML = dayElementTag;

    const dayButtons = document.querySelectorAll('.selectable');
    dayButtons.forEach(daybutton => {
        daybutton.addEventListener("click", () => {
            toggleGoalEditContainer(daybutton.textContent, monthsShort[currentMonth], currentYear);
            READ_DAILY_GOALS_FROM_DATABASE(useruid, daybutton.textContent, monthsShort[currentMonth], currentYear);
        });
    });
};

rendarCalendar();

calendarControlButtons.forEach(button => {
    button.addEventListener("click", () => {
        currentMonth = button.classList.contains("bx-chevron-left") ? currentMonth - 1 : currentMonth + 1;
        if (currentMonth < 0 || currentMonth > 11) {
            currentDate = new Date(currentYear, currentMonth);
            currentMonth = currentDate.getMonth();
            currentYear = currentDate.getFullYear();
        } else {
            currentDate = new Date();
        }
        rendarCalendar();
    });
});

todayButton.addEventListener("click", () => {
    currentDate = new Date();
    currentDay = currentDate.getDate();
    currentMonth = currentDate.getMonth();
    currentYear = currentDate.getFullYear();
    toggleGoalEditContainer(currentDay, monthsShort[currentMonth], currentYear);
    READ_DAILY_GOALS_FROM_DATABASE(useruid, currentDay, monthsShort[currentMonth], currentYear);
    rendarCalendar();
});


// Goal Edit & View

const selectedDate = document.querySelector('.selected-date');
const dataUnavailableMessage = document.querySelector('.data-unavailable-message-container');
const taskContainer = document.querySelector('.tasks-container');
const oldTaskContainer = document.querySelector('.old-tasks-container');
const goalEditBox = document.querySelector('.goal-edit-box');
const goalEditBoxTitle = document.querySelector('.goal-edit-box-title');
const goalEditNameField = document.querySelector('.goal-edit-name-field');
const goalEditProgressField = document.querySelector('.goal-edit-progress-field');
const goalEditProgressTotalField = document.querySelector('.goal-edit-progress-total-field');
const goalTagField = document.querySelector('.goal-tags-field');
const resetGoalsButton = document.querySelector('.reset-goals-button');
const createNewGoalButton = document.querySelector('.create-new-goal-button');
const saveGoalEditButton = document.querySelector('.saveGoalEditButton');
const cancelGoalEditButton = document.querySelector('.cancelGoalEditButton');
const removeGoalButton = document.querySelector('.removeGoalButton');
const dailyGoalsMeterBar = document.querySelector('.daily-goals-meter-bar');

const totalWeeklyGoals = document.querySelector('.total-goals.week');
const totalWeeklyCompletedGoals = document.querySelector('.total-completed-goals.week');
const totalMonthlyGoals = document.querySelector('.total-goals.month');
const totalMonthlyCompletedGoals = document.querySelector('.total-completed-goals.month');
const weeklyGoalsProgress = document.querySelector('.circular-progress.week');
const monthlyGoalsProgress = document.querySelector('.circular-progress.month');
const weeklyGoalsProgressPercentage = document.querySelector('.progress-percent.week');
const monthlyGoalsProgressPercentage = document.querySelector('.progress-percent.month');
const expandChartViewBox = document.querySelector('.expand-chart-view-box');
const expandChartViewBoxTitle = document.querySelector('.chart-data-period');
const moreWeeklyStatisticsButtons = document.querySelectorAll('.more-statistics-button');
const closeChartViewButton = document.querySelector('.closeChartViewButton');
const navigatePageButtons = document.querySelectorAll('.navigatePageButton');

var selectedGoalID;

const todayDate = `${currentDay} ${monthsShort[currentMonth]} ${currentYear}`;
selectedDate.textContent = todayDate;

// Helper Function
const toggleDataUnavailableMessage = function (isDateAvailble) {
    if (isDateAvailble) {
        dataUnavailableMessage.classList.add("hidden");
        if (taskContainer.classList.contains("hidden")) {
            oldTaskContainer.classList.remove("hidden");
        }
    } else {
        dataUnavailableMessage.classList.remove("hidden");
        oldTaskContainer.classList.add("hidden");
    }
};

const switchGoalEditBoxTitle = function () {
    goalEditBoxTitle.textContent = goalEditBox.classList.contains("creation-mode") ? "Create New goal" : "Edit Goal";
    saveGoalEditButton.textContent = goalEditBox.classList.contains("creation-mode") ? "Create" : "Save";
};

const toggleGoalEditBox = function (isShow, mode="") {
    if (isShow) {
        goalEditBox.style.visibility = "visible";
        goalEditBox.style.opacity = 1;
        if (mode=="creation") {
            goalEditBox.classList.add("creation-mode");
            switchGoalEditBoxTitle();
        } else {
            goalEditBox.classList.remove("creation-mode");
            switchGoalEditBoxTitle();
        }
    } else {
        goalEditBox.style.visibility = "hidden";
        goalEditBox.style.opacity = 0;
    }
};

const resetGoalElements = function (DEBUG_MODE=false) {
    const minElementCount = DEBUG_MODE === true ? 2 : 1;
    const taskContainer = document.querySelector('.tasks-container');
    while (taskContainer.childElementCount > minElementCount) {
        taskContainer.removeChild(taskContainer.lastElementChild);
    }
};

const resetDailyGoalElements = function (DEBUG_MODE=false) {
    const minElementCount = DEBUG_MODE === true ? 2 : 1;
    const oldTaskContainer = document.querySelector('.old-tasks-container');
    while (oldTaskContainer.childElementCount > minElementCount) {
        oldTaskContainer.removeChild(oldTaskContainer.lastElementChild);
    }
};

const resetGoalTagElements = function (DEBUG_MODE=false) {
    const minElementCount = DEBUG_MODE === true ? 2 : 1;
    const goalTagsContainer = document.querySelector('.goal-tags-container');
    while (goalTagsContainer.childElementCount > minElementCount) {
        goalTagsContainer.removeChild(goalTagsContainer.lastElementChild);
    }
};

const resetBarElements = function (DEBUG_MODE=false) {
    const minElementCount = DEBUG_MODE === true ? 2 : 1;
    const barsContainer = document.querySelector('.bars-container');
    while (barsContainer.childElementCount > minElementCount) {
        barsContainer.removeChild(barsContainer.lastElementChild);
    }
};

const resetPieElements = function (DEBUG_MODE=false) {
    const minElementCount = DEBUG_MODE === true ? 2 : 1;
    const pieChartContainer = document.querySelector('.pie-chart');
    const pieLegendContainer = document.querySelector('.pie-chart-legend');
    while (pieChartContainer.childElementCount > minElementCount) {
        pieChartContainer.removeChild(pieChartContainer.lastElementChild);
        pieLegendContainer.removeChild(pieLegendContainer.lastElementChild);
    }
};

const createGoalsBarChart = function (barValue, barName) {
    const barsContainer = document.querySelector('.bars-container');
    const barTemplate = document.querySelector('.bar-template');
    const barElement = barTemplate.content.cloneNode(true);
    const bar = barElement.querySelector('.bar');
    const barValueText = barElement.querySelector('.bar-value');
    const barPercent = barElement.querySelector('.bar-percent');
    const xLabel = barElement.querySelector('.x-label');
    xLabel.textContent = barName;
    bar.style.height = `${barValue}%`;
    if (barValue > 95) {
        barValueText.style.top = "0.5rem";
        barValueText.style.color = "#49fee0";
    } else if (barValue >= 30 && barValue < 65) {
        bar.style.background = "#43d0b9";
    } else if (barValue < 30) {
        barValueText.style.color = "#772322";
        bar.style.background = "#e2807e";
    }
    barPercent.style.setProperty('--num', barValue);
    barsContainer.appendChild(barElement);
};

const createGoalsPieChart = function (goalTypesInfo) {
    resetPieElements();
    if (goalTypesInfo != {}) {
        const pieChartContainer = document.querySelector('.pie-chart');
        const pieTemplate = document.querySelector('.pie-template');
        const pieLegendContainer = document.querySelector('.pie-chart-legend');
        const pieLegendTemplate = document.querySelector('.pie-lengend-template');

        var rotatedAngle = 0;
        const stringToColor = function (inputString) {
            let hash = 0;
            for (let i = 0; i < inputString.length; i++) {
                hash = inputString.charCodeAt(i) + ((hash << 5) - hash);
            }
            const cyan = Math.abs((hash * 0.3) % 100);
            const green = Math.abs((hash * 0.6) % 100);
            const blue = Math.abs((hash * 0.9) % 100);
            const color = `rgb(${cyan}%, ${green}%, ${blue}%)`;
            console.log(hash);

            return color;
        };

        for (let goalTag in goalTypesInfo) {
            if (goalTag != "goal_total") {
                const pieElement = pieTemplate.content.cloneNode(true);
                const pie = pieElement.querySelector('.pie');
                const pieLabel = pieElement.querySelector('.pie-label');
                const pieValue = pieElement.querySelector('.pie-value');

                const pieLengendElement = pieLegendTemplate.content.cloneNode(true);
                const pieLegend = pieLengendElement.querySelector('.pie-legend');
                const pieIndicator = pieLengendElement.querySelector('.pie-indicator');
                const pieName = pieLengendElement.querySelector('.pie-name');

                const piePercentValue = (goalTypesInfo[goalTag] / goalTypesInfo.goal_total * 100).toFixed(0);
                const pieColor = stringToColor(goalTag);
                pie.style.setProperty('--pie-percent', `${piePercentValue}%`);
                pie.style.setProperty('--rotateAngle', `${rotatedAngle}turn`);
                pie.style.setProperty('--pie-color', `${pieColor}`);
                pieValue.style.setProperty('--pie-value', piePercentValue);
                pieLegend.addEventListener("mouseover", () => { pieLabel.classList.add("show"); });
                pieLegend.addEventListener("mouseout", () => { setTimeout(() => { pieLabel.classList.remove("show"); }, 1000); });
                rotatedAngle += piePercentValue / 100;

                pieName.textContent = goalTag;
                pieIndicator.style.setProperty('--pie-color', `${pieColor}`);

                pieChartContainer.appendChild(pieElement);
                pieLegendContainer.appendChild(pieLengendElement);
            }
        }
    }
};

const createGoalTags = function (goalTagName) {
    const goalTagsContainer = document.querySelector('.goal-tags-container');
    const goalTagTemplate = document.querySelector('.goal-tag-template');
    const goalTagElement = goalTagTemplate.content.cloneNode(true);
    const goalTag = goalTagElement.querySelector('.goal-tag');
    goalTag.textContent = goalTagName;
    goalTag.addEventListener("click", () => { goalTagField.value = goalTag.textContent; });
    goalTagsContainer.appendChild(goalTagElement);
};

const createGoalInfoData = function (goalName, goalCompletion, goalProgress, goalProgressTotal, goalTag) {
    var goalInfoData = {};
    if (goalName != "") {
        Object.assign(goalInfoData, {
            "goal_name": goalName
        });
    }
    if (goalCompletion != "") {
        Object.assign(goalInfoData, {
            "goal_completion": goalCompletion
        });
    }
    if (goalProgress != "") {
        Object.assign(goalInfoData, {
            "goal_progress": goalProgress
        });
    }
    if (goalProgressTotal != "") {
        Object.assign(goalInfoData, {
            "goal_progress_total": goalProgressTotal
        });
    }
    if (goalTag != "") {
        Object.assign(goalInfoData, {
            "goal_tag": goalTag
        });
    }
    return goalInfoData;
};

const toggleMoreDetailedStatisticsView = function (isDisplayed) {
    if (isDisplayed) {
        expandChartViewBox.classList.remove("hidden");
    } else {
        expandChartViewBox.classList.add("hidden");
    }
};

const updateStatsUIBasic = function (totalGoalsWeekly, totalGoalsWeeklyCompletion, totalGoalsMonthly, totalGoalsMonthlyCompletion) {
    // Texts
    totalWeeklyGoals.textContent = totalGoalsWeekly;
    totalWeeklyCompletedGoals.textContent = totalGoalsWeeklyCompletion;
    totalMonthlyGoals.textContent = totalGoalsMonthly;
    totalMonthlyCompletedGoals.textContent = totalGoalsMonthlyCompletion;
    // Circular Progress Bar
    var weeklyProgress = ((totalGoalsWeeklyCompletion / totalGoalsWeekly) * 100).toFixed(0);
    var monthlyProgress = ((totalGoalsMonthlyCompletion / totalGoalsMonthly) * 100).toFixed(0);
    weeklyProgress = !isNaN(weeklyProgress) ? weeklyProgress : 0;
    monthlyProgress = !isNaN(monthlyProgress) ? monthlyProgress : 0;
    weeklyGoalsProgress.style.setProperty('--progress', weeklyProgress);
    monthlyGoalsProgress.style.setProperty('--progress', monthlyProgress);
    weeklyGoalsProgressPercentage.style.setProperty('--num', weeklyProgress);
    monthlyGoalsProgressPercentage.style.setProperty('--num', monthlyProgress);
};


// PROGRESS BAR
const PROGRESS_BAR_UPDATE = function (userUID, isDateAvailble, day="", month="", year="") {
    const dailyGoalInfoRef = refD(database);
    if (isDateAvailble) {
        get(child(dailyGoalInfoRef, `users/${userUID}/dailyGoal/${year}/${month}/${day}`)).then((snapshot) => {
            if (snapshot.exists()) {
                var snapshotInfo = snapshot.val().goal_list;
                var totalTask = snapshotInfo.length;
                var finishedTask = 0;
                for (let i = 0; i < totalTask; i++) {
                    finishedTask += Number(snapshotInfo[i].goal_completion);
                }
                let progressBarHeight = (1 - finishedTask / totalTask) * 100;
                dailyGoalsMeterBar.style.height = `${progressBarHeight}%`;
            } else {
                console.log("No stored goals data.");
                dailyGoalsMeterBar.style.height = "100%";
            }
        });
    } else {
        get(child(dailyGoalInfoRef, `users/${userUID}/goals/`)).then((snapshots) => {
            if (snapshots.exists()) {
                var finishedTask = 0;
                var totalTask = 0;
                snapshots.forEach((snapshot) => {
                    finishedTask += (snapshot.val().goal_completion) ? Number(snapshot.val().goal_completion) : 0;
                    totalTask += 1;
                });
                let progressBarHeight = (1 - finishedTask / totalTask) * 100;
                dailyGoalsMeterBar.style.height = `${progressBarHeight}%`;
            } else {
                console.log("No stored goals data.");
                dailyGoalsMeterBar.style.height = "100%";
            }
        });
    }  
};


// RESET TODAY's GOALS
const RESET_TODAY_GOALS = function (userUID) {
    const goalInfoRef = refD(database);
    get(child(goalInfoRef, `users/${userUID}/goals/`)).then((snapshots) => {
        if (snapshots.exists()) {
            snapshots.forEach((snapshot) => {
                const resetGoalInfoData = { "goal_completion": "0", "goal_progress": "0", "goal_progress_total": "1" };
                update(refD(database, `users/${userUID}/goals/${snapshot.val().goal_date}/`), resetGoalInfoData)
                    .then(() => {
                        deselectButtonsOnGoalsReset();
                        PROGRESS_BAR_UPDATE(userUID, false);
                        GET_GOALS_STATISTICS(userUID, todayDate);
                        UPDATE_DAILY_GOALS_TO_DATABASE(userUID);
                    })
                    .catch((error) => {
                        alert(`Please try again. Error: ${error.message}`);
                    });
            });
        } else {
            console.log("No stored goals data.");
        }
    });
};


// CREATION
const CREATE_NEW_GOAL = function (userUID, goalName, completion="0", goalDate="", goalProgress, goalProgressTotal, goalTag) {
    const taskContainer = document.querySelector('.tasks-container');
    const taskTemplate = document.querySelector('.task-template');
    const taskElement = taskTemplate.content.cloneNode(true);
    const taskCompleteButton = taskElement.querySelector('.completionButton');
    const taskCompleteButtonIcon = taskElement.querySelector('.completionButton i');
    const taskTitle = taskElement.querySelector('.task-title');
    const taskEditButton = taskElement.querySelector('.taskEditButton');

    var isTaskCompleted = "";

    taskTitle.textContent = goalName;

    // Edit Task
    taskEditButton.addEventListener("click", () => {
        GET_GOAL_TAGS(userUID);
        selectedGoalID = goalDate;
        toggleGoalEditBox(true, "");
        goalEditNameField.value = taskTitle.textContent;
        goalEditProgressField.value = goalProgress;
        goalEditProgressTotalField.value = goalProgressTotal;
        goalTagField.value = goalTag;
        goalTagField.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                UPDATE_GOAL_TAGS_TO_DATABASE(useruid, goalTagField.value);
            }
        })
        if (isTaskCompleted != "") {
            goalEditProgressField.value = isTaskCompleted;
            goalEditProgressTotalField.value = "1";
        }
    });
    // Complete Task button
    taskCompleteButtonIcon.className = (completion == "1" || completion == "1.00") ? "bx bxs-check-circle" : "bx bx-circle";
    taskCompleteButton.addEventListener("click", () => {
        taskCompleteButtonIcon.className = (taskCompleteButtonIcon.className == "bx bx-circle") ? "bx bxs-check-circle" : "bx bx-circle";
        isTaskCompleted = (taskCompleteButtonIcon.className == "bx bx-circle") ? "0" : "1";
        UPDATE_GOAL_TO_DATABASE(userUID, "", goalDate, isTaskCompleted, isTaskCompleted, "1", "");
    });

    taskContainer.appendChild(taskElement);
};

const CREATE_NEW_DAILY_GOAL = function (snapshotInfo) {
    const oldTaskContainer = document.querySelector('.old-tasks-container');
    const oldTaskTemplate = document.querySelector('.old-task-template');
    const oldTaskElement = oldTaskTemplate.content.cloneNode(true);
    const oldTaskTitle = oldTaskElement.querySelector('.old-task-title');
    const oldTaskPercentage = oldTaskElement.querySelector('.old-task-percentage');
    oldTaskTitle.textContent = snapshotInfo.goal_name;
    oldTaskPercentage.textContent = `${Math.floor(Number(snapshotInfo.goal_completion)*100)}%`;
    oldTaskContainer.appendChild(oldTaskElement);
};


// READ
const READ_DAILY_GOALS_FROM_DATABASE = function (userUID, day, month, year) {
    resetDailyGoalElements();
    const dailyGoalInfoRef = refD(database);
    get(child(dailyGoalInfoRef, `users/${userUID}/dailyGoal/${year}/${month}/${day}`)).then((snapshot) => {
        toggleDataUnavailableMessage(snapshot.exists());
        if (snapshot.exists()) {
            var snapshotInfo = snapshot.val().goal_list;
            for (let i = 0; i < snapshotInfo.length; i++) {
                CREATE_NEW_DAILY_GOAL(snapshotInfo[i]);
            }
        } else {
            console.log("No stored goals data.");
        }
        PROGRESS_BAR_UPDATE(userUID, true, day, month, year);
        GET_GOALS_STATISTICS(userUID, `${day} ${month} ${year}`);
    });
};

const READ_GOALS_FROM_DATABASE = function (userUID) {
    resetGoalElements();
    const goalInfoRef = refD(database);
    get(child(goalInfoRef, `users/${userUID}/goals/`)).then((snapshots) => {
        PROGRESS_BAR_UPDATE(userUID, false);
        GET_GOALS_STATISTICS(userUID, todayDate);
        toggleDataUnavailableMessage(snapshots.exists());
        if (snapshots.exists()) {
            var snapshotList = [];
            snapshots.forEach((snapshot) => {
                snapshotList.push({ "goal_name": snapshot.val().goal_name, "goal_date": snapshot.val().goal_date, "goal_completion": snapshot.val().goal_completion, "goal_progress": snapshot.val().goal_progress ? snapshot.val().goal_progress : "0", "goal_progress_total": snapshot.val().goal_progress_total ? snapshot.val().goal_progress_total : "1", "goal_tag": snapshot.val().goal_tag ? snapshot.val().goal_tag : "" });
            });
            for (let snapshotDict of snapshotList) {
                CREATE_NEW_GOAL(userUID, snapshotDict.goal_name, snapshotDict.goal_completion, snapshotDict.goal_date, snapshotDict.goal_progress, snapshotDict.goal_progress_total, snapshotDict.goal_tag);
            };
            const dailyGoalInfoData = { "goal_list": snapshotList, "goal_list_date": todayDate };
            update(refD(database, `users/${userUID}/dailyGoal/${currentYear}/${monthsShort[currentMonth]}/${currentDay}`), dailyGoalInfoData)
                .then(() => { })
                .catch((error) => {
                    alert(`Please try again. Error: ${error.message}`);
                });            
        } else {
            console.log("No stored goals data.");
        }
    });
};

const GET_GOAL_TAGS = function (userUID) {
    resetGoalTagElements();
    const goalInfoRef = refD(database);
    get(child(goalInfoRef, `users/${userUID}/goalTags/`)).then((snapshots) => {
        if (snapshots.exists()) {
            snapshots.forEach(snapshot => {
                createGoalTags(snapshot.val().goal_tag);
            });
        } else {
            console.log("No stored goal tags data.");
        }
    });
};

const GET_GOALS_STATISTICS = function (userUID, selectedDate) {
    resetBarElements();
    let [day, month, year] = selectedDate.split(/\s+/);
    const goalStatsRef = refD(database);
    get(child(goalStatsRef, `users/${userUID}/dailyGoal/${year}/${month}`)).then((snapshots) => {
        if (snapshots.exists()) {
            var totalGoalsWeekly = 0;
            var totalGoalsWeeklyCompletion = 0;
            var totalGoalsMonthly = 0;
            var totalGoalsMonthlyCompletion = 0;
            var snapshotsLength = snapshots.val().length ? snapshots.val().length : 1;
            for (let i = 0; i < snapshotsLength; i++) {
                var index = snapshots.val().length ? i : day;
                if (snapshots.val()[index]) {
                    var snapshot = snapshots.val()[index].goal_list;
                    var snapshotDay = Number(snapshots.val()[index].goal_list_date.split(/\s+/)[0]);
                    for (let j = 0; j < snapshot.length; j++) {
                        // Weekly Stats
                        if (snapshotDay <= day && snapshotDay >= day - 6) {
                            totalGoalsWeeklyCompletion += Number(snapshot[j].goal_completion);
                            totalGoalsWeekly += 1;
                        }
                        // Monthly Stats
                        totalGoalsMonthlyCompletion += Number(snapshot[j].goal_completion);
                        totalGoalsMonthly += 1;
                    }
                }
            }
            updateStatsUIBasic(totalGoalsWeekly, totalGoalsWeeklyCompletion, totalGoalsMonthly, totalGoalsMonthlyCompletion);
        } else {
            updateStatsUIBasic(0, 0, 0, 0);
        }
    });
};

const GET_GOALS_MORE_DETAILED_STATISTICS = function (userUID, selectedDate, viewMode="month") {
    resetBarElements();
    let [day, month, year] = selectedDate.split(/\s+/);
    const goalStatsRef = refD(database);
    get(child(goalStatsRef, `users/${userUID}/dailyGoal/${year}/${month}`)).then((snapshots) => {
        if (snapshots.exists()) {
            let
                goalProgressByTagsInfo = {},
                goalTypesInfo = { "goal_total": 0 };
            var snapshotsLength = snapshots.val().length ? snapshots.val().length : 1;
            for (let i = 0; i < snapshotsLength; i++) {
                var index = snapshots.val().length ? i : day;
                if (snapshots.val()[index]) {
                    var snapshot = snapshots.val()[index].goal_list;
                    var snapshotDay = Number(snapshots.val()[index].goal_list_date.split(/\s+/)[0]);
                    for (let j = 0; j < snapshot.length; j++) {
                        // Monthly Stats or Weekly Stats
                        var getDataCondition = viewMode == "month" ? true : (snapshotDay <= day && snapshotDay >= day - 6);
                        if (getDataCondition) {
                            var goalTag = snapshot[j].goal_tag ? snapshot[j].goal_tag : "Untagged";
                            var goalCompletion = snapshot[j].goal_completion ? Number(snapshot[j].goal_completion) : 0;
                            if (!(goalTag in goalProgressByTagsInfo)) {
                                goalProgressByTagsInfo[goalTag] = { "goal_completion": goalCompletion, "goal_total": 1 };
                                goalTypesInfo[goalTag] = 1;
                            } else {
                                goalProgressByTagsInfo[goalTag].goal_completion += goalCompletion;
                                goalProgressByTagsInfo[goalTag].goal_total += 1;
                                goalTypesInfo[goalTag] += 1;
                            }
                            goalTypesInfo["goal_total"] += 1;
                        }
                    }
                }
            }            
            // Creat bar chart
            Object.keys(goalProgressByTagsInfo).forEach((goalTag) => {
                var goalValue = (goalProgressByTagsInfo[goalTag].goal_completion / goalProgressByTagsInfo[goalTag].goal_total * 100).toFixed(0);
                createGoalsBarChart(goalValue, goalTag);
            });
            // Create pie chart
            createGoalsPieChart(goalTypesInfo);
        } else {
            
        }
    });
};


// WRITE
const UPDATE_DAILY_GOALS_TO_DATABASE = function (userUID) {
    const goalInfoRef = refD(database);
    get(child(goalInfoRef, `users/${userUID}/goals/`)).then((snapshots) => {
        if (snapshots.exists()) {
            var snapshotList = [];
            snapshots.forEach((snapshot) => {
                snapshotList.push({ "goal_name": snapshot.val().goal_name, "goal_date": snapshot.val().goal_date, "goal_completion": snapshot.val().goal_completion, "goal_tag": snapshot.val().goal_tag });
            });
            const dailyGoalInfoData = { "goal_list": snapshotList, "goal_list_date": todayDate };
            update(refD(database, `users/${userUID}/dailyGoal/${currentYear}/${monthsShort[currentMonth]}/${currentDay}`), dailyGoalInfoData)
                .then(() => {
                    PROGRESS_BAR_UPDATE(userUID, true, currentDay, monthsShort[currentMonth], currentYear);
                    GET_GOALS_STATISTICS(userUID, `${currentDay} ${monthsShort[currentMonth]} ${currentYear}`);
                })
                .catch((error) => {
                    alert(`Please try again. Error: ${error.message}`);
                });
        } else {
            console.log("No stored goals data.");
        }
    });
};

const UPDATE_GOAL_TAGS_TO_DATABASE = function (userUID, goalTag) {
    if (goalTag != "") {
        var goalTagsInfo = { "goal_tag": goalTag };
        update(refD(database, `users/${userUID}/goalTags/${goalTag}`), goalTagsInfo)
            .then(() => { GET_GOAL_TAGS(userUID); })
            .catch((error) => { alert(error.message); });
    }
};

const UPDATE_GOAL_TO_DATABASE = function (userUID, goalName, goalDate, goalCompletion, goalProgress, goalProgressTotal, goalTag) {
    if (goalName != "" || goalCompletion != "") {
        var updatedGoalInfoData;
        var goalProgressVal = 0;
        if (goalProgress == "" || goalProgressTotal == "") {
            updatedGoalInfoData = createGoalInfoData(goalName, goalCompletion, goalCompletion, "1", goalTag);
        } else {
            if (Number(goalProgressTotal) == 0) {
                alert("Progress total must be greater than 0!");
                return false;
            } else if (Number(goalProgress) <= Number(goalProgressTotal)) {
                goalProgressVal = (Number(goalProgress) / Number(goalProgressTotal)).toFixed(2);
                updatedGoalInfoData = createGoalInfoData(goalName, `${goalProgressVal}`, goalProgress, goalProgressTotal, goalTag);
            } else {
                alert("Progress value cannot be greater than progress total!");
                return false;
            }
        }
        // Update goal data
        update(refD(database, `users/${userUID}/goals/${goalDate}`), updatedGoalInfoData)
            .then(() => {
                if (goalCompletion == "") {
                    READ_GOALS_FROM_DATABASE(userUID);
                    toggleGoalEditBox(false, "");
                }
                PROGRESS_BAR_UPDATE(userUID, false);
                GET_GOALS_STATISTICS(userUID, todayDate);
                UPDATE_DAILY_GOALS_TO_DATABASE(userUID);
            })
            .catch((error) => {
                alert(`Please try again. Error: ${error.message}`);
            });
        // Update goal tags
        UPDATE_GOAL_TAGS_TO_DATABASE(userUID, goalTag);
    } else if (goalName == "" && goalCompletion == "") {
        alert("Goal name cannot be empty!");
    }
};

const WRITE_GOAL_TO_DATABASE = function (userUID, goalName, goalTag) {
    if (goalName != "") {
        const goalDate = Date.now();
        const goalInfoData = { "goal_name": goalName, "goal_date": goalDate, "goal_completion": "0", "goal_tag": goalTag };
        update(refD(database, `users/${userUID}/goals/${goalDate}`), goalInfoData)
            .then(() => {
                READ_GOALS_FROM_DATABASE(userUID);
                UPDATE_DAILY_GOALS_TO_DATABASE(userUID);
                UPDATE_GOAL_TAGS_TO_DATABASE(userUID, goalTag);
                toggleGoalEditBox(false, "");
            })
            .catch((error) => {
                alert(`Please try again. Error: ${error.message}`);
            });
    } else {
        alert("Goal name cannot be empty!");
    }
};


// DELETION
const REMOVE_GOAL_FROM_DATABASE = function (userUID, goalID) {
    let [day, month, year] = todayDate.split(/\s+/);
    const deleteGoalTask = refD(database, `users/${userUID}/goals/${goalID}`);
    if (goalID != "") {
        remove(deleteGoalTask)
            .then(() => { READ_GOALS_FROM_DATABASE(userUID); UPDATE_DAILY_GOALS_TO_DATABASE(userUID); toggleGoalEditBox(false, ""); })
            .catch((error) => { alert(error.message); });
        get(child(refD(database), `users/${userUID}/dailyGoal/${year}/${month}/${day}`))
            .then((snapshot) => {
                if (snapshot.exists()) {
                    if (!snapshot.val().length) {
                        const deleteGoalTask = refD(database, `users/${userUID}/dailyGoal/${year}/${month}/${day}`);
                        remove(deleteGoalTask);
                    }
                }
            });
    }

};

const CONFIRM_ACTION_CONSENT = function (confirmQuestion) {
    var userDecision = confirm(confirmQuestion);
    return userDecision;
};

cancelGoalEditButton.addEventListener("click", () => { toggleGoalEditBox(false, ""); });

closeChartViewButton.addEventListener("click", () => { toggleMoreDetailedStatisticsView(false); });

navigatePageButtons.forEach((navigatePageButton) => {
    const chartBox = document.querySelector('.chart-box');
    const pieChartBox = document.querySelector('.pie-chart-box');
    navigatePageButton.addEventListener("click", () => {
        navigatePageButtons.forEach((navigatePageButton) => { navigatePageButton.disabled = false; });
        navigatePageButton.disabled = true;
        if (navigatePageButton.classList.contains("pageLeftButton")) {
            // To Page Before
            pieChartBox.style.opacity = 0;
            setTimeout(() => {
                pieChartBox.classList.add("hidden");
                chartBox.classList.remove("hidden");
            }, 250);
            setTimeout(() => {
                chartBox.style.opacity = 1;
            }, 260);
        } else {
            // To Page After
            chartBox.style.opacity = 0;            
            setTimeout(() => {
                chartBox.classList.add("hidden");
                pieChartBox.classList.remove("hidden");
            }, 250);
            setTimeout(() => {
                pieChartBox.style.opacity = 1;
            }, 260);
        }
    });
});