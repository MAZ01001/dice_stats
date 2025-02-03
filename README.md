# Dice Stats

DND dice rolls and statistics (success chance)

## How to use

1. Open <https://maz01001.github.io/dice_stats/>
2. Click <kbd>Add roll</kbd> to add a new dice roll/throw (block).
   1. You can edit the `Name` text to say what ever you whant for example `Strength`.
      - If you clear it and press enter or navigate away from it, it will remove this block without further asking.
   2. Enter a number into the `Value` field to compare to the dice throw (within this block).
      - When pressing <kbd>Enter</kbd> inside this field, all dice within this block will be rolled.
   3. Choose a comparison operator, default is &ge;, so it succeeds if `Value` is greater or equal the dice throw result (sum for multiple dice).
   4. Then, near the empty area, choose a dice type (like <kbd>D20</kbd>) and click the <kbd>Add</kbd> button next to it, to add that dice to this dice throw (within this block).
      - To remove dice just click on them, while the colored toggle-button at the bottom is red and says <kbd>Click to remove</kbd>.
        - And, if there are no dice, double-clicking on the empty dice area will remove the whole block instead (with the toggle-button in the mentioned state).
      - The area where the dice are is also resizable, to reset the sizing to automatic, double-click the bottom right corner (within the area).
      - Currently up to 5 dice can be added per block (_limited by the speed of the probability calculation_).
        - _You could increase it by changing `Roll.MAX_DICE` in dev-console, but be carefull since the calculation scales exponentually!_
3. Now you can click on <kbd>Roll all</kbd> to roll all dice on the page at the same time and see the results.
   - Dice will turn green when their entire block meets its condition and red if it fails.
   - The border of the entire viewing rectangle will turn green when all blocks/dice throws succeed, and red if not.
   - _The border/dice color will remain grey if not all dice where rolled or not all `Value` fields are valid (ie. empty)_.
4. You can also toggle the colored button at the bottom from <kbd>Click to remove</kbd> (red) to <kbd>Point to rotate</kbd> (green) for automatic dice rolling by just moving the mouse over the dice (or clicking on them / double-clicking on area beneath them).

The percentages within each block show how likely it is for any given roll to succeed its condition and at the bottom of the page is the total chance of success over all rolls.

You can also navigate this page with keyboard only (and touch should also work just fine).

The layout changes to a collumn with rows instead of rows with blocks when the screen width is smaller than its height.

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

## WIP

- Improve calculating statistics for multiple (different) dice in one block/throw
- Add more options to URL args
