import random

class Deck:
    def __init__(self):
        self.shuffle()

    def shuffle(self):
        self.cards = []
        for i in range(0,54):
            self.cards.append(Card(i))
        self.hands = {}

    def drawNum(self, user, tag):
        if len(self.cards) == 0:
            return -1

        index = random.randint(0,len(self.cards)-1)
        card = self.cards[index]
        if len(tag) > 0:
            card.tag = tag

        del self.cards[index]

        if not user in self.hands:
            self.hands[user] = []

        self.hands[user].append(card)

        return card

    # returns an array: [success,message]
    def trade(self, src, dest, cards):
        if user not in self.hands:
            return [False,src + " has no cards; trade aborted"]
        
        trades = []
        failed_trades = []
        for card in cards:
            if card in self.hands[user]:
                self.hands[src].pop(card)
                self.hands[dest].append(card)
                trades.append(card)
            else:
                failed_trades.append(card)

        result_string = ''
        if len(failed_trades) > 0:
            result_string += src + " does not hold the following: "
            for fail in failed_trades:
                result_string += fail.toString() + ' '
            result_string += '; cannot trade them away.\n'

        if len(trades) > 0:
            result_string += src + ' gives ' + dest + ': '
            for trade in trades:
                result_string += trade.toString();

        return result_string

    def draw(self, user, tag):
        return self.drawNum(user,tag).toString()

    def empty(self):
        return len(self.cards) == 0

    def cardsLeft(self):
        return len(self.cards)

    def discard(self, user, cardIndex):
        card = self.hands[user][cardIndex]
        self.hands[user].pop(cardIndex)
        if len(self.hands[user]) == 0:
            self.hands.pop(user)
        return '%s discards %s' % (user, card.toString())

class Card:
    ranks = ['Deuce','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Jack','Queen','King','Ace']
    suits = ['Clubs', 'Diamonds', 'Hearts', 'Spades']

    def __init__(self,num):
        self.num = num
        self.tag = ''

    def toString(self):
        if self.num < 0:
            return 'No cards!'

        cardString = ''
        if self.num >= 52:
            cardString = ':black_joker:'
        else:
            cardString = Card.ranks[int(self.num/4)]
            cardString += ' of ' + Card.suits[self.num%4]
        
        if len(self.tag) > 0:
            cardString += ' [' + self.tag + ']'

        return cardString

    def __lt__(self,other):
        return self.num < other.num

    def __eq__(self,other):
        return self.num == other.num

    def __hash__(self):
        return self.num.__hash__() ^ self.tag.__hash__()
