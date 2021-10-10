from Die import Die
import random


# creates a Die object from a string, of the format NdS, or simply S
# NdS format creates N dice with S sides, example: 2d6 creates two six-sided dice
# S format creates 1 die with S sides, example: 8 creates one eight-sided die
def parse_die(dieStr):
    out = Die(1, 1)
    if len(dieStr) == 0:
        return out
    d_index = dieStr.find('d')

    if d_index == -1:  # no d, this is format two
        out.num = 1
        out.sides = int(dieStr)
    else:  # format one
        out.num = int(dieStr[0:d_index])
        out.sides = int(dieStr[d_index + 1:])

    return out


# parses a string, splitting it into a collection of inputs that can be input to roll_dice_sum
# spaces are treated as +
def parse_general_input(arg):
    if len(arg) == 0:
        return 0
    d_index = arg.find('d')
    if d_index == -1:
        return int(arg)
    else:
        num_dice = max(0, int(arg[0:d_index]))
        num_sides = max(0, int(arg[d_index + 1:]))
        # track the sum of all rolls
        total = 0

        # perform all the rolls, tally the total
        for i in range(num_dice):
            result = random.randint(1, num_sides)
            total += result

        return total


# checks if a string represents an integer
def int_format(arg) -> bool:
    try:
        int(arg)
        return True
    except ValueError:
        return False
