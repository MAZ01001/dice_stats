# Dice Stats

DND dice rolls and statistics (success chance).

- [Documentation](#documentation "Scroll to section: Documentation")
- [Quick start](#quick-start "Scroll to section: Quick start")
  - [Format](#format "Scroll to section: Format")
- [Console DIY](#console-diy "Scroll to section: Console DIY")
- [WIP](#wip "Scroll to section: WIP")

> <https://maz01001.github.io/dice_stats/>

## Documentation

Buttons at the bottom of the view box:

<table>
   <tr><th>Button</th>                  <th>Description</th></tr>
   <tr><td><kbd>Add&nbsp;roll</kbd></td><td>Adds a new (dice roll) block; Currently 100 blocks maximum.</td></tr>
   <tr>
      <td><kbd style="background-color:#800;color:#ff0">Click&nbsp;to&nbsp;remove</kbd></td>
      <td>
         <p>Switches between different modes for pointer action:</p>
         <dl>
            <dt><kbd style="background-color:#800;color:#ff0">Click&nbsp;to&nbsp;remove</kbd></dt>
            <dd>Click on dice to remove them; Double click on the empty dice area to remove the whole block.</dd>
            <dt><kbd style="background-color:#040;color:#0f0">Click&nbsp;to&nbsp;rotate</kbd></dt>
            <dd>Click on dice to roll them (individually); Double click on the block or the dice area within it to roll all dice within that.</dd>
            <dt><kbd style="background-color:#630;color:#ff0">Swipe&nbsp;to&nbsp;rotate</kbd></dt>
            <dd>
               Same as <kbd style="background-color:#040;color:#0f0">Click&nbsp;to&nbsp;rotate</kbd>, but also moving the mouse over dice rolls them (individually);
               For touch start a swipe on a dice graphic and then moving over any dice on the screen rolls them (individually),
               to scroll the page by swiping over dice simply start swiping, then tap anywhere with a second finger,
               and it should cancel the "dice rolling" and revert back to normal swipe controls.
            </dd>
         </dl>
      </td>
   </tr>
   <tr><td><i>Source Code</i></td>      <td>Link to this Repository.</td></tr>
   <tr><td><kbd>Permalink</kbd></td>    <td>Create a permalink with the current setup (see <a href="#url-hash-quick-start" title="scroll to section: Quick start">Quick start</a>).</td></tr>
   <tr><td><kbd>Roll&nbsp;all</kbd></td><td>Rolls all dice on the page at once.</td></tr>
   <tr><td>--%</td>                     <td>Shows the total chance of success for all blocks; is "--%" when not all blocks have dice and not all <kbd>Value</kbd> fields are filled in (see below) or there are no blocks to begin with.</td></tr>
</table>

Within each block:

<table>
   <tr><th>Field</th>                  <th>Description</th></tr>
   <tr><td>Name</td>                   <td>Custom name for this dice roll block (only visual change); Click to edit; Pressing <kbd>Enter</kbd> or navigating away from it while it's empty will remove the entire block without further asking.</td></tr>
   <tr><td><kbd>Value</kbd></td>       <td>Number input field for comparing with dice roll result; When pressing <kbd>Enter</kbd> here, all dice within this block are rolled.</td></tr>
   <tr><td><kbd>&ge;</kbd></td>        <td>Selection of comparison operator between <kbd>Value</kbd> and dice roll result; Currently these are <kbd>&ge;</kbd>, <kbd>&le;</kbd>, <kbd>&gt;</kbd>, <kbd>&lt;</kbd>, and <kbd>=</kbd>.</td></tr>
   <tr><td></td>                       <td>initially invisible, when two or more dice are present, shows the dice roll result (sum of dice values).</td></tr>
   <tr><td><i>[Dice&nbsp;area]</i></td><td>Resizeable area; To revert back to automatic sizing, double-click on the bottom right corner.</td></tr>
   <tr><td>--%</td>                    <td>Shows the chance of success of the condition of this block; is "--%" when <kbd>Value</kbd> is not filled in or there are no dice.</td></tr>
   <tr><td><kbd>Add</kbd></td>         <td>Adds a new (<kbd>D20</kbd>) dice to this block; Currently 48 dice maximum per block.</td></tr>
   <tr>
      <td><kbd>D20</kbd></td>
      <td><p>Select the dice to add with <kbd>Add</kbd>; Currently supported dice are:</p>

   | Name            | Description       | Possible results     |
   | --------------- | ----------------- | -------------------- |
   | <kbd>C</kbd>    | Two sided coin    | `{1, 2}`             |
   | <kbd>D4</kbd>   | Four sided dice   | `{1, 2, 3, 4}`       |
   | <kbd>D6</kbd>   | Six sided dice    | `{1, 2, ..., 6}`     |
   | <kbd>D8</kbd>   | Eight sided dice  | `{1, 2, ..., 8}`     |
   | <kbd>D10</kbd>  | Ten sided dice    | `{1, 2, ..., 10}`    |
   | <kbd>D12</kbd>  | Twelve sided dice | `{1, 2, ..., 12}`    |
   | <kbd>D20</kbd>  | Twenty sided dice | `{1, 2, ..., 20}`    |
   | <kbd>D100</kbd> | Ten sided dice    | `{10, 20, ..., 100}` |

   </td>
   </tr>
</table>

When dice are rolled they are colored based on success (<span style="color:#0c0">green</span> &iff; success, <span style="color:#f44">red</span> &iff; failure, and grey if the <kbd>Value</kbd> field of that block is not filled in)
and so is the border of the viewing box (same colors but all blocks need to be successful for it to count as successful).

You can also navigate this page with keyboard-only, touch-only should also work just fine.

The layout changes to a column with rows instead of rows with blocks when the screen width is smaller than its height (usually mobile devices have this ratio).

Scroll [UP](#documentation "Scroll to start of section: Documentation")
    | [TOP](#dice-stats "Scroll to top of document: Dice Stats")

## Quick start

Directly loading full dice roll setup from URL hash (#):

- <https://maz01001.github.io/dice_stats/#D20>

  ```text
  empty >= { 1 * D20 }
  ```

- <https://maz01001.github.io/dice_stats/#2=2C,13+2D6+D12,123%3C=3D100d100>

  ```text
  2 = { 2 * C }
  13 >= { 2 * D6 + 1 * D12 }
  123 <= { 4 * D100 }
  ```

- <https://maz01001.github.io/dice_stats/#150%3E12d20,15+2d12,5gtd8,roll>

  ```text
  150 > { 12 * D20 }
  15 >= { 2 * D12 }
  5 > { 1 * D8 }

  roll all dice after loading
  ```

### Format

The general format is:

`"Name title"` `Value` `Operator` `Dice list`

- `"Name title"` any text within double quotes where `"` is escaped as `""` or `\"` and `\` is escaped as `\\` (can be empty: `""`)
- `Value` any positive (finite) integer (including 0)
- `Operator` one of `GE` `>=` `LE` `<=` `GT` `>` `LT` `<` `EQ` `=` `==` `===` (case insensitive)
- `Dice list` list of `amount` `dice type` with `+` as separator (and at the beginning)
  - `Amount` positive integer smaller than 2<sup>53</sup> (automatically caps at `MAX_DICE`)
  - `Dice type` one of `C` `D4` `D6` `D8` `D10` `D12` `D20` `D100` (case insensitive) other dice like `D404` are parsed but ignored

where each box is optional and the whole thing can be repeated with `,` as a separator (yes `,,,` is valid and creates 3 empty boxes)

also, copy-pasting url/format directly on the page loads that setup

and for those that can read regular expressions:

```javascript
/(?!$)(?:"((?:\\.|""|[^\\"])*)")?(?:(?:(\d*)([><]=?|==?=?|[GL][ET]|EQ))?(\+?\d*(?:C+\+?\d*|(?:D\d+)+(?:\+\d*)?)*(?:C+|(?:D\d+)+))?|(\d+)((?:\+\d*)?(?:C+\+?\d*|(?:D\d+)+(?:\+\d*)?)*(?:C+|(?:D\d+)+))?)(?:,|$)/giy
```

Scroll [UP](#quick-start "Scroll to start of section: Quick start")
    | [TOP](#dice-stats "Scroll to top of document: Dice Stats")

## Console DIY

Inside the browser dev console, some limits can be adjusted:

| Variable               | Description                                              | Default | Limit                             |
| ---------------------- | -------------------------------------------------------- | ------- | --------------------------------- |
| `Dice.ANIM_TIME`       | Animation speed of dice rolls in milliseconds            | 1000    | &lbrack;0,&infin;&lbrack;         |
| `Roll.PRINT_PRECISION` | Number of decimal places for percentages (only visually) | 5       | &lbrack;0..20&rbrack;             |
| `Roll.MAX_DICE`        | Maximum amount of dice per block                         | 48      | &lbrack;0..90071992547409&rbrack; |
| `Sheet.MAX_ROLLLS`     | Maximum amount of blocks                                 | 100     | &lbrack;0..2<sup>53</sup>&lbrack; |

Also, you can generate a number based on a dice type like so:

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

And access to the probability-calculation function via the `Probability` class:

```javascript
const P = new Probability();

// setup probabiity for a dice throw with: C, D12, D20, D20, D100, C, D10
P.Setup([DiceType.C, DiceType.D12, DiceType.D20, DiceType.D20, DiceType.D100, DiceType.C, DiceType.D10]);
// or
P.Setup([2, 2, 10, 12, 20, 20, {max: 100, step: 10, faces: 10}]); // (slightly faster in ascending order)
// (creates internal table of length 167 = 1 + 2 + 2 + 10 + 12 + 20 + 20 + 100)

// check what is the chance of "80 >= sum of dice" for a random dice roll
const chance = P.Check(80, (value, diceSum) => value >= diceSum);
// 0.395 → 39.5% for 80 >= sum of dice when rolling given dice (simultaneously)
```

Scroll [UP](#console-diy "Scroll to start of section: Console DIY")
    | [TOP](#dice-stats "Scroll to top of document: Dice Stats")

## WIP

- better documentation in JSDoc
