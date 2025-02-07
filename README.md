# Dice Stats

DND dice rolls and statistics (success chance).

> <https://maz01001.github.io/dice_stats/>

## Quick start

You can start with a dice up and rolling like so

- Coin: <https://maz01001.github.io/dice_stats/#C>
- D4: <https://maz01001.github.io/dice_stats/#D4>
- D6: <https://maz01001.github.io/dice_stats/#D6>
- D8: <https://maz01001.github.io/dice_stats/#D8>
- D10: <https://maz01001.github.io/dice_stats/#D10>
- D12: <https://maz01001.github.io/dice_stats/#D12>
- D20: <https://maz01001.github.io/dice_stats/#D20>
- D100: <https://maz01001.github.io/dice_stats/#D100>

## Documentation

Buttons at the bottom of the view box:

<table>
   <tr><th>Button</th><th>Description</th></tr>
   <tr>
      <td><kbd>Add&nbsp;roll</kbd></td>
      <td>Adds a new (dice roll) block; Currently 100 blocks maximum.</td>
   </tr>
   <tr>
      <td><kbd>Click&nbsp;to&nbsp;remove</kbd></td>
      <td>
         Switches between different modes for pointer action:
         <fieldset><legend><kbd>Click to remove</kbd></legend>
            Click on dice to remove them; Double click on empty dice area to remove the whole block.
         </fieldset>
         <fieldset><legend><kbd>Click to rotate</kbd></legend>
            Click on dice to roll them (individually); Double click on block or the dice area within it to roll all dice within that.
         </fieldset>
         <fieldset><legend><kbd>Swipe to rotate</kbd></legend>
            Same as <kbd>Click to rotate</kbd>, but also moving the mouse over dice rolls them (individually);
            For touch start a swipe on a dice graphic and then moving over any dice on screen rolls them (individually),
            to scroll the page with swiping over dice simply start swiping, then tap anywhere with a second finger,
            and it should cancel the "dice rolling" and revert back to normal swipe controlls.
         </fieldset>
      </td>
   </tr>
   <tr>
      <td><i>Source Code</i></td>
      <td>Link to this Repositiory.</td>
   </tr>
   <tr>
      <td><kbd>Roll&nbsp;all</kbd></td>
      <td>Rolls all dice on the page at once.</td>
   </tr>
   <tr>
      <td>--%</td>
      <td>Shows the total chance that all conditions are meet with all dice rolled simulatiously; is "--%" when not all blocks have dice and not all <kbd>Value</kbd> fields are filled in (see below) or there are no block to begin with.</td>
   </tr>
</table>

And within each block:

<table>
   <tr><th>Field</th><th>Description</th></tr>
   <tr>
      <td>Name</td>
      <td>Custom name for this dice roll block (only visual change); Click to edit; Pressing <kbd>Enter</kbd> or navigating away from it while it's empty will remove the entire block without further asking.</td>
   </tr>
   <tr>
      <td><kbd>Value</kbd></td>
      <td>Number input field for comparing with dice roll result; When pressing <kbd>Enter</kbd> here, all dice within this block are rolled.</td>
   </tr>
   <tr>
      <td><kbd>&ge;</kbd></td>
      <td>Selection of comparison opperator between <kbd>Value</kbd> and dice roll result; Currently these are <kbd>&ge;</kbd>, <kbd>&le;</kbd>, <kbd>&gt;</kbd>, <kbd>&lt;</kbd>, and <kbd>=</kbd>.</td>
   </tr>
   <tr>
      <td></td>
      <td>initially invisible, when two or more dice are present, shows the dice roll result (sum of dice values).</td>
   </tr>
   <tr>
      <td><i>[Dice&nbsp;area]</i></td>
      <td>Resizeable area; To revert back to automatic sizing, double click on the bottom right corner.</td>
   </tr>
   <tr>
      <td>--%</td>
      <td>Shows the chance that this blocks condition is meet with all dice (within this block) rolled simulatiously; is "--%" whn <kbd>Value</kbd> is not filled in or there are no dice.</td>
   </tr>
   <tr>
      <td><kbd>Add</kbd></td>
      <td>Adds a new (<kbd>D20</kbd>) dice to this block; Currently 48 dice maximum per block.</td>
   </tr>
   <tr>
      <td><kbd>D20</kbd></td>
      <td>
         Select the dice to add with <kbd>Add</kbd>; Currently supported dice are:
         <table>
            <tr><th>Name</th><th>Description</th><th>Possible results</th></tr>
            <tr><td><kbd>C</kbd></td><td>Two sided coin</td><td><code>{1, 2}</code></td></tr>
            <tr><td><kbd>D4</kbd></td><td>Four sided dice</td><td><code>{1, 2, 3, 4}</code></td></tr>
            <tr><td><kbd>D6</kbd></td><td>Six sided dice</td><td><code>{1, 2, ..., 6}</code></td></tr>
            <tr><td><kbd>D8</kbd></td><td>Eight sided dice</td><td><code>{1, 2, ..., 8}</code></td></tr>
            <tr><td><kbd>D10</kbd></td><td>Ten sided dice</td><td><code>{1, 2, ..., 10}</code></td></tr>
            <tr><td><kbd>D12</kbd></td><td>Twelve sided dice</td><td><code>{1, 2, ..., 12}</code></td></tr>
            <tr><td><kbd>D20</kbd></td><td>Twenty sided dice</td><td><code>{1, 2, ..., 20}</code></td></tr>
            <tr><td><kbd>D100</kbd></td><td>Ten sided dice</td><td><code>{10, 20, ..., 100}</code></td></tr>
         </table>
      </td>
   </tr>
</table>

When dice are rolled they are collored based on success (<span style="color:#0c0">green</span> &iff; success, <span style="color:#f44">red</span> &iff; failure, and grey if the <kbd>Value</kbd> field of that block is not filled in)
and so is the border of the viewing box (same colors but all blocks need to be successfull for it to count as successfull).

You can also navigate this page with keyboard only and touch only should also work just fine.

The layout changes to a collumn with rows instead of rows with blocks when the screen width is smaller than its height (usually mobile devices have this ratio).

## Console DIY

Inside browser dev-console some constrains can be overwritten:

<table>
   <tr><th>Variable</th><th>Description</th><th>Default</th><th>Limit</th></tr>
   <tr><td><code>Dice.ANIM_TIME</code></td><td>Animation speed of dice rolls in milliseconds</td><td>1000</td><td>&lbrack;0,&infin;&lbrack;</td></tr>
   <tr><td><code>Roll.PRINT_PRECISION</code></td><td>Number of decimal places for percentages (only visually)</td><td>5</td><td>&lbrack;0..20&rbrack;</td></tr>
   <tr><td><code>Roll.MAX_DICE</code></td><td>Maximum amount of dice per block</td><td>48</td><td>&lbrack;0..90071992547409&rbrack;</td></tr>
   <tr><td><code>MAX_ROLLLS</code></td><td>Maximum amount of blocks</td><td>100</td><td>&lbrack;0..2<sup>53</sup>&lbrack;</td></tr>
</table>

Also you can generate a number based on a dice type like so:

```javascript
// with supported dice
Dice.RNG(DiceType.C);    //=> random in {1, 2}
Dice.RNG(DiceType.D4);   //=> random in {1, 2, 3, 4}
Dice.RNG(DiceType.D6);   //=> random in {1, 2, ..., 6}
Dice.RNG(DiceType.D8);   //=> random in {1, 2, ..., 8}
Dice.RNG(DiceType.D10);  //=> random in {1, 2, ..., 10}
Dice.RNG(DiceType.D12);  //=> random in {1, 2, ..., 12}
Dice.RNG(DiceType.D20);  //=> random in {1, 2, ..., 20}
Dice.RNG(DiceType.D100); //=> random in {10, 20, ..., 100}
// with custom dice
Dice.RNG(33); //=> random in {1, 2, ..., 33}
Dice.RNG({max: 50, step: 5, faces: 10}); //=> random in {5, 10, 15, ..., 50}
```

The random number generator uses `MurmurHash3` for seeding (on page load) and then `sfc32` for generating random unsigned 32bit integers;
Available by the global `RNG` class (see <https://github.com/MAZ01001/Math-Js#rngjs> for more information) or use the same instance the dice use with the global constant `rng`.

```javascript
// (many features of my original RNG class have been removed here since they weren't needed)
rng.val32; // gives a random unsigned 32bit integer
// create a new RNG obj with seed "seed"
const random = new RNG("seed");
random.val32; // 2460423161
```

And access to the probability-calculation function via the `Probabiity` class:

```javascript
const P = new Probability();

// setup probabiity for a dice throw with: C, D12, D20, D20, D100, C, D10
P.Setup([DiceType.C, DiceType.D12, DiceType.D20, DiceType.D20, DiceType.D100, DiceType.C, DiceType.D10]);
// or
P.Setup([2, 2, 10, 12, 20, 20, {max: 100, step: 10, faces: 10}]); // (slightly faster in ascending order)
// (creates internal table of length 167 = 1 + 2 + 2 + 10 + 12 + 20 + 20 + 100)

// check chance of "80 >= sum of dice" for a random dice roll (with dice setup set before)
const chance = P.Check(80, (value, diceSum) => value >= diceSum);
// 0.395 → 39.5% for 80 >= sum of dice when rolling given dice (simultaneously)
```

## WIP

- Add more options to URL args
- better documentation in JSDoc
