let intervalDuration = 1000;  // milliseconds (1 second)
let gameInterval = null;
var energy = 0;
var canClick = true;
var swords = 0;
var manualClicksThisSecond = 0;
var speedUpgrades = 0;
var sharpnessUpgrade = 1; // Multiplier for energy gain
let exp = 0;
let level = 1;
let expToNextLevel = 10; // Starting threshold
const unlockedSkills = {}; // all unlocked skills

//List of all skill requirements
const skillDependencies = {
  skill1: [],               // no prereqs
  skill2: ['skill1'],       // branches from skill1
  skill3: ['skill1'],       // branches from skill1
  skill4: ['skill2', 'skill3']  // requires both skill2 and skill3
};

//Makes a skill unlockable
function canUnlock(skillId) {
  const prereqs = skillDependencies[skillId] || [];
  return prereqs.every(prereq => unlockedSkills[prereq]);
}

//Unlocks skill
function unlockSkill(skillId) {
  if (unlockedSkills[skillId]) return; // already unlocked

  if (canUnlock(skillId)) {
    unlockedSkills[skillId] = true;
    updateSkillVisuals();
  } else {
    alert("You can't unlock this skill yet!");
  }
}

//Updates the color of the skill boxes if their locked or unlocked
function updateSkillVisuals() {
  Object.keys(skillDependencies).forEach(skillId => {
    const skill = document.getElementById(skillId);

    if (unlockedSkills[skillId]) {
      skill.classList.remove('locked', 'unlockable');
      skill.classList.add('unlocked');
      skill.style.cursor = 'default';
    } else if (canUnlock(skillId)) {
      skill.classList.remove('locked', 'unlocked');
      skill.classList.add('unlockable');
      skill.style.cursor = 'pointer';
    } else {
      skill.classList.remove('unlocked', 'unlockable');
      skill.classList.add('locked');
      skill.style.cursor = 'not-allowed';
    }
  });
}

// Adds Exp
function addExp(amount) {
    exp += amount;
    if (exp >= expToNextLevel) {
        level++;
        exp -= expToNextLevel;
        expToNextLevel = Math.floor(10 * Math.pow(2, level)); // Increase difficulty
    }
    updateExpBar();
}

// Updates the exp bar animation


function updateExpBar() {
    const expBar = document.getElementById("expBarFill");
    const expText = document.getElementById("expText");

    let percent = (exp / expToNextLevel) * 100;
    expBar.style.width = percent + "%";

    // Use formatNumber for experience values
    expText.innerText = `Level ${level}: ${formatNumber(exp)} / ${formatNumber(expToNextLevel)}`;
}



// Starts game internal tick rate
function startGameInterval() {
    if (gameInterval !== null) {
        clearInterval(gameInterval);
    }
    gameInterval = setInterval(function () {
        cutClick(swords);
        updateEnergyPerSecond();
    }, intervalDuration);
}

// Just update energy display without animation
function updateEnergyText() {
    const energySpan = document.getElementById("energy");
    energySpan.innerHTML = formatNumber(energy);
}

// Trigger animation for energy element
function animateEnergyPop() {
    const energySpan = document.getElementById("energy");

    energySpan.classList.remove("pop");
    void energySpan.offsetWidth; // Force reflow
    energySpan.classList.add("pop");

    energySpan.addEventListener("animationend", function handler() {
        energySpan.classList.remove("pop");
        energySpan.removeEventListener("animationend", handler);
    });
}


// Update Attack Speed display
function updateAttackSpeedDisplay() {
    let seconds = (intervalDuration / 1000).toFixed(2);
    document.getElementById("attackSpeed").innerHTML = formatNumber(seconds);
}

// Increase game speed
function speedUpGame() {
    var speedCost = Math.floor(1000000 * Math.pow(1.3, speedUpgrades));
    if (energy >= speedCost) {
        intervalDuration = Math.max(100, intervalDuration - 200);
        startGameInterval();
        updateAttackSpeedDisplay();
        speedUpgrades++;
        energy -= speedCost;
        updateEnergyText();
        animateEnergyPop(); // animation only on user action
		document.getElementById('speedUpgradeCount').innerText = formatNumber(speedUpgrades);

    }
    var nextCost = Math.floor(1000000 * Math.pow(1.1, speedUpgrades));
    document.getElementById('speedCost').innerHTML = formatNumber(nextCost);
}

// Calculate energy per second
function updateEnergyPerSecond() {
    let autoEnergyPerSecond = swords * sharpnessUpgrade;
    let manualEnergyPerSecond = manualClicksThisSecond * sharpnessUpgrade;
    let totalEnergyPerSecond = autoEnergyPerSecond + manualEnergyPerSecond;

    document.getElementById("energyPerSecond").innerHTML = formatNumber(totalEnergyPerSecond);
    manualClicksThisSecond = 0;
}

// Manual click once per second
function manualClick(number) {
    if (canClick) {
        let gain = number * sharpnessUpgrade;
		addExp(gain);
		energy += gain;

        manualClicksThisSecond += number;
        updateEnergyText();
        animateEnergyPop(); // only here
        canClick = false;
        setTimeout(() => {
            canClick = true;
        }, 1000);
    }
}

// Auto gain from swords (no animation here)
function cutClick(number) {
    if (number > 0) {
		let gain = number * sharpnessUpgrade;
		addExp(gain);
		energy += gain;
        updateEnergyText();
    }
}

// Buy a sword
function buySword() {
    var swordCost = Math.floor(10 * Math.pow(1.1, swords));
    if (energy >= swordCost) {
        swords++;
        energy -= swordCost;
        document.getElementById('swords').innerHTML = formatNumber(swords);
        updateEnergyText();
        animateEnergyPop(); // animate on sword buy
    }
    var nextCost = Math.floor(10 * Math.pow(1.1, swords));
    document.getElementById('swordCost').innerHTML = formatNumber(nextCost);
}

//Buy sharpness

function sharpen() {
    var sharpenCost = Math.floor(1500 * Math.pow(1.25, sharpnessUpgrade-1));
    if (energy >= sharpenCost) {
        sharpnessUpgrade++;
        energy -= sharpenCost;
        document.getElementById('sharpness').innerHTML = formatNumber(sharpnessUpgrade)
    }
    var nextCost = Math.floor(1500 * Math.pow(1.25, sharpnessUpgrade-1));
    document.getElementById('sharpenCost').innerHTML = formatNumber(nextCost);
}


// Convert numbers > 1 M or < 0.001 to scientific and rounds them
function formatNumber(n) {
    // Round the number to the nearest whole number
    const rounded = Math.round(n);

    // Use exponential notation if it's extremely large or small
    if (Math.abs(rounded) >= 1e6 || (Math.abs(rounded) > 0 && Math.abs(rounded) < 0.001)) {
        return rounded.toExponential(2); // Scientific notation with 2 decimal places
    } else {
        return rounded.toLocaleString(undefined, { maximumFractionDigits: 0 }); // Normal formatting, no decimals
    }
}

// Hides unused tabs and displays current tab
function openTab(tabId) {
    const tabs = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].style.display = 'none';
    }
    document.getElementById(tabId).style.display = 'block';
}






// Initialize game
startGameInterval();
updateAttackSpeedDisplay();
// Open main tab on page load
openTab('mainTab');
// Initialize visuals on page load
updateSkillVisuals();
updateEnergyText();
updateEnergyPerSecond();
