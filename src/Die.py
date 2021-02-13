import random


class Die:

    def __init__(self, num, sides):
        self.num = num
        self.sides = sides

    def roll(self):
        sum = 0
        if self.sides <= 0:
            return sum
        for n in range(self.num):
            sum += random.randint(1, self.sides)
        return sum
