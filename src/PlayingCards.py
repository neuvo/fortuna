import random
import Utils


class Deck:
    def __init__(self):
        self.shuffle()

    class DrawRequest:
        def __init__(self):
            self.num_cards = None
            self.tag = None

        def empty(self) -> bool:
            return self.num_cards is None and self.tag is None

        def complete(self) -> bool:
            return self.num_cards is not None and self.tag is not None

        def has_num_cards(self) -> bool:
            return self.num_cards is not None

        def has_tag(self) -> bool:
            return self.tag is not None

        def set_tag(self, tag):
            self.tag = str(tag)

        def append_tag(self, tag_append):
            if self.tag is None:
                self.tag = tag_append
            elif len(tag_append) > 0:
                self.tag += ' ' + tag_append
            else:
                self.tag += tag_append

        def set_num(self, num_cards):
            if Utils.int_format(num_cards):
                self.num_cards = int(num_cards)

    def shuffle(self):
        self.cards = []
        for i in range(0, 54):
            self.cards.append(Card(i))
        self.hands = {}
        self.discard_pile = []

    def draw_num(self, user, tag):
        if len(self.cards) == 0:
            return -1

        index = random.randint(0, len(self.cards) - 1)
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
            return [False, src + " has no cards; trade aborted"]

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
        return self.draw_num(user, tag).toString()

    def empty(self):
        return len(self.cards) == 0

    def cards_left(self):
        return len(self.cards)

    def discard(self, user, card):
        self.hands[user].remove(card)
        if len(self.hands[user]) == 0:
            self.hands.pop(user)
        self.discard_pile.append(card)
        return '%s discards %s' % (user, card.toString())


class Card:
    ranks = ['Deuce', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King', 'Ace']
    suits = ['Clubs', 'Diamonds', 'Hearts', 'Spades']

    def __init__(self, num):
        self.num = num
        self.tag = ''

    def toString(self):
        if self.num < 0:
            return 'No cards!'

        cardString = ''
        if self.num >= 52:
            cardString = ':black_joker:'
        else:
            cardString = Card.ranks[int(self.num / 4)]
            cardString += ' of ' + Card.suits[self.num % 4]

        if len(self.tag) > 0:
            cardString += ' [' + self.tag + ']'

        return cardString

    def __lt__(self, other):
        return self.num < other.num

    def __eq__(self, other):
        return self.num == other.num

    def __hash__(self):
        return self.num.__hash__() ^ self.tag.__hash__()
