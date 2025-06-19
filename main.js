let intervalDuration = 1000;  // milliseconds (1 second)
let gameInterval = null;
var energy = 1500000;
var canClick = true;
var swords = 0;
var manualClicksThisSecond = 0;
var speedUpgrades = 0;
var sharpnessUpgrade = 1; // Multiplier for energy gain
var flurryUpgrades = 0;
let exp = 0;
let level = 1;
let expToNextLevel = 10; // Starting threshold
const unlockedSkills = {}; // all unlocked skills
var flurryHitchance = 0; // 0% chance
var bonusHits = 4;
let momentumLevel = 0;
let momentumStacks = 0;
let maxMomentumStacks = 50;
let baseInterval = 1000; // base attack interval in ms
let momentumIntervalReduction = 10; // ms per stack
let isOverheating = false;
let skillPoints = 0;
const skillCosts = {
  skill1: 1,      // Sword Creation costs 1 skill point
  skill2: 3,      // Sharpness costs 2 skill points
  momentum: 5,    // Momentum costs 3 skill points
  piercer: 5,     // Piercer costs 3 skill points
  flurry: 5       // Flurry Slash costs 3 skill points
};



//List of all skill requirements
const skillDependencies = {
  skill1: [],               // Sword Creation (root skill)
  skill2: ['skill1'],       // Sharpness unlocks after Sword Creation
  momentum: ['skill2'],     // Momentum unlocks after Sharpness
  piercer: ['skill2'],      // Piercer unlocks after Sharpness
  flurry: ['skill2']        // Flurry Slash unlocks after Sharpness
};


//Makes a skill unlockable
function canUnlock(skillId) {
  const prereqs = skillDependencies[skillId] || [];
  return prereqs.every(prereq => unlockedSkills[prereq]);
}

//Unlocks skill
function unlockSkill(skillId) {
  if (unlockedSkills[skillId]) return; // already unlocked

  if (!canUnlock(skillId)) {
    alert("You can't unlock this skill yet!");
    return;
  }

  const cost = skillCosts[skillId] || 0;
  if (skillPoints < cost) {
    alert(`You need ${cost} skill point(s) to unlock this skill!`);
    return;
  }

  skillPoints -= cost;          // Deduct skill points
  unlockedSkills[skillId] = true;
  updateSkillVisuals();
  updateSkillPointsDisplay();

  // Update upgrade buttons visibility after unlocking
  if(typeof updateUpgradeButtonsVisibility === "function") {
    updateUpgradeButtonsVisibility();
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
//Updates skillpoints
function updateSkillPointsDisplay() {
    const skillPointsSpan = document.getElementById("skillPoints");
    if(skillPointsSpan) {
      skillPointsSpan.innerText = skillPoints;
    }
}
//Updates sword visuals
function updateSwordVisual() {
    const sword = document.getElementById("swordImage");
    sword.classList.remove("low-momentum", "medium-momentum", "high-momentum", "overheat");
	sword.classList.add("base");


    if (isOverheating) {
        sword.classList.add("overheat");
    } else if (momentumStacks >= 35) {
        sword.classList.add("high-momentum");
    } else if (momentumStacks >= 20) {
        sword.classList.add("medium-momentum");
    } else if (momentumStacks >= 5) {
        sword.classList.add("low-momentum");
    }
}

//Sword animation
function triggerSwordSwing() {
    const sword = document.getElementById("swordImage");
    sword.classList.remove("swing"); // Restart animation
    void sword.offsetWidth;          // Force reflow
    sword.classList.add("swing");
}

// Adds Exp
function addExp(amount) {
    exp += amount;
    if (exp >= expToNextLevel) {
        level++;
        skillPoints++;        // <-- Add skill point on level up
        exp -= expToNextLevel;
        expToNextLevel = Math.floor(10 * Math.pow(2, level)); // Increase difficulty
        updateSkillPointsDisplay(); // <-- Update the display for skill points
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
		flurrySlash();
    }, intervalDuration);
}

// Just update energy display without animation
function updateEnergyText() {
    const energySpans = document.querySelectorAll("#energy");
	energySpans.forEach(span => {
		span.innerHTML = formatNumber(energy);
	});

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

function gainMomentum() {
    if (isOverheating) return; // Can't gain momentum during Overheat

    if (momentumStacks < maxMomentumStacks) {
        momentumStacks++;
        updateAttackSpeedFromMomentum();
		updateSwordVisual();
		console.log("Gaining momentum");
        // Enter Overheat if max reached
        if (momentumStacks === maxMomentumStacks) {
            triggerOverheat();
        }
    }
}
function resetMomentum() {
    momentumStacks = 0;
    isOverheating = false;
    intervalDuration = getBaseSpeedFromUpgrades();
    startGameInterval();
    updateAttackSpeedDisplay();
    updateSwordVisual();
    console.log("Momentum reset after overheat.");
}

function triggerOverheat() {
    isOverheating = true;
    console.log("Overheating! Maintaining max momentum for 5 seconds...");
    updateSwordVisual();
    // Keep max stacks for 5 seconds
    setTimeout(() => {
        resetMomentum();
    }, 5000);
}

function updateAttackSpeedFromMomentum() {
    const speedBonus = momentumStacks * momentumIntervalReduction;
    intervalDuration = Math.max(100, getBaseSpeedFromUpgrades() - (momentumStacks * momentumIntervalReduction));
    startGameInterval();
    updateAttackSpeedDisplay();
}


// Random chance for a burst of extra cutClick actions
function flurrySlash() {
  

   if (swords > 0 && Math.random() < flurryHitchance) {
        for (let i = 0; i < bonusHits; i++) {
            cutClick(swords);
			animateEnergyPop(); // only here and skills
			
        }

        // Optional: Visual or console feedback
        console.log("Flurry Slash triggered!");
    }
}
function updateAttackSpeedDisplay() {
    // Calculate attacks per second from intervalDuration (ms)
    const attacksPerSecond = 1000 / intervalDuration;
    
    // Find the attack speed span element
    const attackSpeedElem = document.getElementById('attackSpeed');
    
    if (attackSpeedElem) {
        // Format to 2 decimal places, e.g. 1.25 sec or attacks/sec depending on preference
        // Your HTML shows "Attack Speed: <span id='attackSpeed'>1.00</span> sec"
        // So show intervalDuration in seconds rounded to 2 decimals:
        attackSpeedElem.innerText = (intervalDuration / 1000).toFixed(2);
    }
}

function speedUpGame() {
    var speedCost = Math.floor(1000000 * Math.pow(1.3, speedUpgrades));
    if (energy >= speedCost && speedUpgrades < 6) {
        speedUpgrades++;
        intervalDuration = getBaseSpeedFromUpgrades();  // ✅ use consistent logic

        startGameInterval();
        updateAttackSpeedDisplay();
        energy -= speedCost;
        updateEnergyText();
        animateEnergyPop(); // animation only on user action
        document.getElementById('speedUpgradeCount').innerText = speedUpgrades;

        if (speedUpgrades >= 6) {
            document.getElementById('speedCostContainer').style.display = 'none';
        }
    } else if (speedUpgrades >= 6) {
        alert("Attack Speed is capped at 0.5!");
        document.getElementById('speedCostContainer').style.display = 'none';
    }

    var nextCost = Math.floor(1000000 * Math.pow(1.1, speedUpgrades));
    document.getElementById('speedCost').innerHTML = formatNumber(nextCost);
}




function buyFlurry() {
    var flurryCost = Math.floor(2500 * Math.pow(1.25, flurryUpgrades));

    if (energy >= flurryCost && flurryHitchance < 0.5) {
        flurryHitchance = Math.min(0.5, flurryHitchance + 0.1);  // Max out at 50%
        flurryUpgrades++;
        energy -= flurryCost;

        document.getElementById('flurryChance').innerHTML = (flurryHitchance * 100).toFixed(1) + '%';

        updateEnergyText();
        animateEnergyPop();

        var nextCost = Math.floor(2500 * Math.pow(1.25, flurryUpgrades));
        document.getElementById('flurryCost').innerHTML = formatNumber(nextCost);

        // Hide entire container when maxed
        if (flurryHitchance >= 0.5) {
			document.getElementById('flurryCostContainer').style.display = "none";
		}

    } else if (flurryHitchance >= 0.5) {
        alert("Flurry chance is capped at 50%!");
        document.getElementById('flurryCostContainer').style.display = "none";
    }
}




// Calculate energy per second
function updateEnergyPerSecond() {
    const attacksPerSecond = 1000 / intervalDuration;

    // Auto attacks per second
    const autoEnergyPerSecond = attacksPerSecond * swords * sharpnessUpgrade;

    // Expected gain from flurry
    const expectedFlurryPerSecond = attacksPerSecond * flurryHitchance * bonusHits * swords * sharpnessUpgrade;

    // Manual energy gain (tracked manually per second)
    const manualEnergyPerSecond = manualClicksThisSecond * sharpnessUpgrade;

    const totalEnergyPerSecond = autoEnergyPerSecond + expectedFlurryPerSecond + manualEnergyPerSecond;

    const epsSpans = document.querySelectorAll("#energyPerSecond");
	epsSpans.forEach(span => {
		span.innerHTML = formatNumber(totalEnergyPerSecond);
	});

    // Reset manual clicks after calculating
    manualClicksThisSecond = 0;
}

// Manual click once per second
function manualClick(number) {
    if (canClick) {
        let gain = number * sharpnessUpgrade;
        addExp(gain);
        energy += gain;
        triggerSwordSwing();
        manualClicksThisSecond += number;
        updateEnergyText();
        animateEnergyPop();

        if (unlockedSkills["momentum"]) {
            gainMomentum(); // Gain stack from manual click
        }

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

        if (unlockedSkills["momentum"]) {
            gainMomentum(); 
        }
    }
}

function updateUpgradeButtonsVisibility() {
  // Show buySword only if skill1 (Sword Creation) unlocked
  document.getElementById('buySwordContainer').style.display = unlockedSkills['skill1'] ? 'block' : 'none';

  // Show buySharpness only if skill2 (Sharpness) unlocked
  document.getElementById('buySharpnessContainer').style.display = unlockedSkills['skill2'] ? 'block' : 'none';

  // Show buyFlurry only if flurry skill unlocked
  document.getElementById('buyFlurryContainer').style.display = unlockedSkills['flurry'] ? 'block' : 'none';

  // You can add more containers similarly...
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
    if (Math.abs(n) >= 1e6 || (Math.abs(n) > 0 && Math.abs(n) < 0.001)) {
        return n.toExponential(2);
    } else {
        return Math.round(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
    }
}

function getBaseSpeedFromUpgrades() {
    return Math.max(100, baseInterval - speedUpgrades * 200);
}


// Hides unused tabs and displays current tab
function openTab(tabId) {
    const tabs = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].style.display = 'none';
    }
    document.getElementById(tabId).style.display = 'block';
}


// IMPORTANT SAVING 
function saveGame() {
    const gameState = {
        energy,
        swords,
        speedUpgrades,
        sharpnessUpgrade,
        flurryUpgrades,
        exp,
        level,
        expToNextLevel,
        unlockedSkills,
        flurryHitchance,
        bonusHits,
        intervalDuration,
		skillPoints
    };

    localStorage.setItem('idleSwordGameSave', JSON.stringify(gameState));
    console.log("Game saved!");
}
function loadGame() {
    const savedGame = JSON.parse(localStorage.getItem('idleSwordGameSave'));

    if (savedGame) {
        energy = savedGame.energy ?? energy;
        swords = savedGame.swords ?? swords;
        speedUpgrades = savedGame.speedUpgrades ?? speedUpgrades;
        sharpnessUpgrade = savedGame.sharpnessUpgrade ?? sharpnessUpgrade;
        flurryUpgrades = savedGame.flurryUpgrades ?? flurryUpgrades;
        exp = savedGame.exp ?? exp;
        level = savedGame.level ?? level;
        expToNextLevel = savedGame.expToNextLevel ?? expToNextLevel;
        Object.assign(unlockedSkills, savedGame.unlockedSkills ?? {});
        flurryHitchance = savedGame.flurryHitchance ?? flurryHitchance;
        bonusHits = savedGame.bonusHits ?? bonusHits;
        intervalDuration = savedGame.intervalDuration ?? intervalDuration;
		skillPoints = savedGame.skillPoints ?? skillPoints;

        // Refresh game state after loading
        updateSkillVisuals();
        updateEnergyText();
        updateEnergyPerSecond();
        updateExpBar();
		updateSkillPointsDisplay();
        document.getElementById('swords').innerHTML = formatNumber(swords);
        document.getElementById('speedUpgradeCount').innerText = speedUpgrades;
        document.getElementById('flurryChance').innerHTML = (flurryHitchance * 100).toFixed(1) + '%';

        document.getElementById('sharpness').innerHTML = formatNumber(sharpnessUpgrade);
        document.getElementById('swordCost').innerHTML = formatNumber(Math.floor(10 * Math.pow(1.1, swords)));
        document.getElementById('speedCost').innerHTML = formatNumber(Math.floor(1000000 * Math.pow(1.1, speedUpgrades)));
        document.getElementById('flurryCost').innerHTML = formatNumber(Math.floor(2500 * Math.pow(1.25, flurryUpgrades)));
        document.getElementById('sharpenCost').innerHTML = formatNumber(Math.floor(1500 * Math.pow(1.25, sharpnessUpgrade-1)));
		updateUpgradeButtonsVisibility();

        startGameInterval();
        updateAttackSpeedDisplay();
		if (speedUpgrades >= 6 || intervalDuration <= 100) {
			document.getElementById('speedCostContainer').style.display = 'none';
		}
		if (flurryHitchance >= 0.5) {
			document.getElementById('flurryCostContainer').style.display = "none";
		}


        console.log("Game loaded!");
    }
}
function reset() {
    if (confirm("Are you sure you want to reset your game?")) {
        localStorage.removeItem('idleSwordGameSave');
        location.reload();
    }
}



// Initialize game
setInterval(saveGame, 30000); // Save every 30 seconds
loadGame();//Load Game
startGameInterval();
updateAttackSpeedDisplay();
// Open main tab on page load
openTab('mainTab');
// Initialize visuals on page load
updateSkillVisuals();
updateEnergyText();
updateEnergyPerSecond();
