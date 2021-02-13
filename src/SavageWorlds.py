import Utils
from Die import Die
from PlayingCards import Deck

MEATSPACE = 'meatspace'
ASTRAL = 'astral'
MATRIX = 'matrix'


def judge_roll(*args) -> str:
    if len(args) != 2 or not Utils.int_format(args[0]) or not Utils.int_format(args[1]):
        return 'Usage: /compare roll TN'

    roll = int(args[0])
    tn = int(args[1])
    msg = str(roll) + ' vs. ' + str(tn) + ' = '
    return msg + count_raises(roll, tn) + '!'


def count_raises(roll, tn):
    msg = ''
    raises = (roll - tn) // 4
    if raises < 0:
        msg += 'miss!'
    elif raises == 0:
        msg += 'hit!'
    else:
        msg = 'hit with ' + str(raises) + ' raise'
        if raises > 1:
            msg += 's'
    return msg


class Game:
    CFG_PATH = '../data/savageworlds.cfg'

    config = {}

    # sets of card numbers in each plane
    planes = {MEATSPACE: set(), ASTRAL: set(), MATRIX: set()}

    class initiative_tracker:
        current = -1
        ordered_card_nums = []

        def init(self, planes):
            sorted_matrix = list(planes[MATRIX])
            sorted_matrix.sort(reverse=True)
            sorted_astral = list(planes[ASTRAL])
            sorted_astral.sort(reverse=True)
            sorted_meatspace = list(planes[MEATSPACE])
            sorted_meatspace.sort(reverse=True)

            self.current = -1
            self.ordered_card_nums = []
            for card_num in sorted_matrix:
                self.ordered_card_nums.append(card_num)
            for card_num in sorted_astral:
                self.ordered_card_nums.append(card_num)
            for card_num in sorted_meatspace:
                self.ordered_card_nums.append(card_num)

        def start(self):
            self.current = 0

        def next(self):
            self.current = (self.current + 1) % len(self.ordered_card_nums)

        def curr(self):
            return self.ordered_card_nums[self.current]

        def initialized(self):
            return self.current != -1

    init_tracker = initiative_tracker()

    def __init__(self, client_command_prefix):
        fo = open(self.CFG_PATH)
        for line in fo:
            if line.find(',') == 0:
                continue
            pair = line.split('=')
            self.config[pair[0]] = pair[1]

        self.the_deck = Deck()
        self.init_usage(client_command_prefix)

    def init_usage(self, client_command_prefix):
        self.ROLL_MSG = ('Roll dice: %sroll <die1> <optional:die2> <optional:mod>\n\tExample: %sroll 1d8 1d6 '
                         '+2\n\tInfo: mod must have a + or a - in front, and be separated by a space. Dice and mods '
                         'may '
                         'be in any order.\n' % (client_command_prefix, client_command_prefix))
        self.DRAW_MSG = ('Draw card(s): %sdraw <optional:number> <optional:tag>\n\tExample: %sdraw 2\n\tInfo: draws 1 '
                         'card if no number is supplied. Optional tag can be used to track cards belonging to different '
                         'characters, but the same player.\n' % (client_command_prefix, client_command_prefix))
        self.COUNTDOWN_MSG = ('See the countdown order: %scountdown\n\tExample: %scountdown\n\tInfo: presents every '
                              'user\'s cards in descending order.\n' % (client_command_prefix, client_command_prefix))
        self.COUNTDOWN_START_MSG = ('Start or restart the countdown order: %scountdown start\n\tInfo: moves the '
                                    'initiative tracker to the top of the round.\n' % (client_command_prefix))
        self.COUNTDOWN_NEXT_MSG = ('Move the initiative tracker one step: %scountdown next\n\tInfo: If the tracker is '
                                   'uninitialized, next will automatically initialize it and move the tracker to the '
                                   'first player.\n' % (client_command_prefix))
        self.HAND_MSG = ('See a user\'s current hand: %shand <optional:username>\n\tExample: %shand neuvo#1301\n' % (
            client_command_prefix, client_command_prefix))
        self.SHUFFLE_MSG = (
                'Return all cards to the deck and shuffle: %sshuffle\n\tExample: %sshuffle\n\tInfo: Only the DM '
                'may shuffle the deck.\n' % (
                    client_command_prefix, client_command_prefix))
        self.CARDS_LEFT_MSG = ('Count how many cards remain in the deck: %scardsleft\n\tExample: %scardsLeft\n' % (
            client_command_prefix, client_command_prefix))
        self.DISCARD_MSG = (
                'Discard cards: %sdiscard <repeated:card number>\n\tExample: %sdiscard 1\n\tInfo: Cards are specified '
                'by their number; use %shand to see them.\n\tYou can pass multiple card numbers at once.\n' % (
            client_command_prefix, client_command_prefix, client_command_prefix))
        self.TAG_MSG = ('Tag a card: %stag <card number> <tag>\n\tExample: %stag 1 azzie commando\n' % (
            client_command_prefix, client_command_prefix))
        self.CLEAR_TAG_MSG = (
                'Remove tags from cards: %sclear_tag <optional repeated:card number>\n\tExample: %sclear_tag 1 2 '
                '3\n\tInfo: if no card numbers are provided, clears tags from all the user\'s cards.' % (
            client_command_prefix, client_command_prefix))

        self.usage_messages = [self.ROLL_MSG, self.DRAW_MSG, self.COUNTDOWN_MSG, self.COUNTDOWN_START_MSG,
                               self.COUNTDOWN_NEXT_MSG, self.HAND_MSG, self.SHUFFLE_MSG, self.CARDS_LEFT_MSG,
                               self.DISCARD_MSG, self.TAG_MSG, self.CLEAR_TAG_MSG]

    def parse_dice(self, dieStr):
        dice = []
        general_die = Utils.parse_die(dieStr)
        for i in range(general_die.num):
            dice.append(Die(1, general_die.sides))
        return dice

    def get_plane_names(self):
        return self.planes.keys()

    # rolls dice for savage worlds.
    # will automatically handle aces and fumbles.
    # format: [die1] [optional:die2] [optional:mod]
    def roll(self, user, args):
        result_string = ''
        if len(args) == 0:
            return self.ROLL_MSG

        dice = []
        mod = 0
        damage_mode = False
        tn_found = False
        tn_mode = False
        tn = 4
        for arg in args:
            if len(arg) == 0:
                continue
            elif arg[0] == '+':
                mod += int(arg[1:])
            elif arg[0] == '-':
                mod -= int(arg[1:])
            elif arg == 'dam' or arg == 'damage' or arg == 'dmg':
                damage_mode = True
            elif arg.lower() == 'tn' or arg.lower() == 'target' or arg.lower() == 'armor' or arg.lower() == 'av':
                tn_mode = True
            elif tn_mode and Utils.int_format(arg):
                tn = int(arg)
                tn_mode = False
                tn_found = True
            else:
                currDice = self.parse_dice(arg)
                dice = dice + currDice

        if len(dice) == 0:
            return 'Need at least one die to roll.'

        snakeEyes = 0
        rolls = []

        result_string += user + ' rolls'
        if damage_mode:
            result_string += ' for damage'
        result_string += '!\n'

        damage = mod
        for i in range(len(dice)):
            die = dice[i]

            if die.sides < 2:
                result_string += 'Die must have at least 2 sides, skipping...\n'
                continue

            result_string += 'Rolling ' + str(die.num) + 'd' + str(die.sides) + ': '
            roll = die.roll()

            result_string += str(roll)
            total = roll
            if roll == 1:
                snakeEyes += 1
            while roll == die.sides:
                result_string += ' [ACE] '
                roll = die.roll()
                total += roll
                result_string += str(roll)

            result_string += '\n'
            rolls.append(total)
            damage += total

        if snakeEyes == len(rolls) and not damage_mode:
            result_string += user + ' fumbled!\n'
        else:
            if len(rolls) == 0:
                result_string += 'No valid dice read; read the /usage message for the command format.'
                return result_string

            best = rolls[0]
            for i in range(1, len(rolls)):
                best = max(best, rolls[i])

            result_string += user + ' rolled '

            if damage_mode:
                result_string += str(damage) + ' damage'
            else:
                result_string += str(best + mod)

            if tn_found:
                result_string += ', scoring a ' + count_raises(best+mod, tn) + ' against TN ' + str(tn)

            result_string += '!'

        return result_string

    def draw(self, username, args):
        num_cards = 1
        tag = ''
        num_start = 0
        tag_start = 0
        plane = 'meatspace'

        if len(args) > 0 and not Utils.int_format(args[0]) and args[0].lower() in self.get_plane_names():
            plane = args[0].lower()
            num_start += 1
            tag_start += 1

        if num_start < len(args) and len(args) > 0 and Utils.int_format(args[num_start]):
            num_cards = int(args[num_start])
            tag_start += 1

        if tag_start < len(args):
            tag = args[tag_start]

        for i in range(tag_start + 1, len(args)):
            tag = tag + ' ' + args[i]

        if self.the_deck.empty():
            return 'The deck is empty! %s cannot draw.' % username

        card = self.the_deck.drawNum(username, tag)
        self.planes[plane].add(card.num)
        outstring = '%s draws %s' % (username, card.toString())

        for i in range(1, num_cards):
            if self.the_deck.empty():
                outstring += '; no more cards remaining.'
                break
            else:
                card = self.the_deck.drawNum(username, tag)
                self.planes[plane].add(card.num)
                outstring += ', ' + card.toString()

        return outstring

    def countdown(self, args):
        if len(self.the_deck.hands) == 0:
            return 'No one has any cards; countdown aborted'
        elif len(args) > 1:
            return self.COUNTDOWN_MSG + self.COUNTDOWN_START_MSG + self.COUNTDOWN_NEXT_MSG

        if self.init_tracker.current == -1:
            self.init_tracker.init(self.planes)

        if len(args) == 1 and args[0].lower() == 'start':
            self.init_tracker.start()
            for user in self.the_deck.hands:
                for card in self.the_deck.hands[user]:
                    if card.num == self.init_tracker.curr():
                        return user + '\'s turn - ' + card.toString() + '\n'
            return 'No cards found.\n'
        elif len(args) == 1 and args[0].lower() == 'next':
            self.init_tracker.next()
            for user in self.the_deck.hands:
                for card in self.the_deck.hands[user]:
                    if card.num == self.init_tracker.curr():
                        return user + '\'s turn - ' + card.toString() + '\n'

        matrix_cards = {}
        astral_cards = {}
        meatspace_cards = {}

        for user in self.the_deck.hands:
            for card in self.the_deck.hands[user]:
                if card.num in self.planes['matrix']:
                    matrix_cards[card] = user
                elif card.num in self.planes['astral']:
                    astral_cards[card] = user
                else:
                    meatspace_cards[card] = user

        result_string = ''
        matrix_keys = list(matrix_cards.keys())
        astral_keys = list(astral_cards.keys())
        meatspace_keys = list(meatspace_cards.keys())
        matrix_keys.sort(reverse=True)
        astral_keys.sort(reverse=True)
        meatspace_keys.sort(reverse=True)

        if len(matrix_keys) > 0:
            result_string += '| MATRIX |\n'
            for matrix_card in matrix_keys:
                line = matrix_cards[matrix_card] + ' holds ' + matrix_card.toString()
                line = self.wrap_countdown_line(matrix_card.num, line)
                result_string += line

        if len(astral_keys) > 0:
            result_string += '| ASTRAL |\n'
            for astral_card in astral_keys:
                line = astral_cards[astral_card] + ' holds ' + astral_card.toString()
                line = self.wrap_countdown_line(astral_card.num, line)
                result_string += line

        if len(meatspace_keys) > 0:
            result_string += '| MEATSPACE |\n'
            for meatspace_card in meatspace_keys:
                line = meatspace_cards[meatspace_card] + ' holds ' + meatspace_card.toString()
                line = self.wrap_countdown_line(meatspace_card.num, line)
                result_string += line

        # sortedKeys = list(sorted_cards.keys())
        # sortedKeys.sort(reverse=True)
        # for card in sortedKeys:
        #     result_string += sorted_cards[card] + ' holds ' + card.toString() + '\n'

        return result_string

    def wrap_countdown_line(self, card_num, line):
        if self.init_tracker.initialized() and self.init_tracker.curr() == card_num:
            line = '>>' + line + '<<'
        line += '\n'
        return line

    def hand(self, username):
        hand = []
        if username in self.the_deck.hands and len(self.the_deck.hands[username]) > 0:
            for card in self.the_deck.hands[username]:
                hand.append(card)
        else:
            return '%s has an empty hand' % (username)

        # hand.sort(reverse=True)
        handStr = []
        for card in hand:
            handStr.append(card.toString() + ' (' + self.get_plane(card.num).upper() + ')')
        result_string = '%s holds:\n' % username
        for i in range(len(hand)):
            result_string += str(i + 1) + ': ' + handStr[i] + '\n'
        result_string += '\n'
        return result_string

    def discard(self, username, args):
        if '-p' in args:
            return self.discard_pile()
        elif username not in self.the_deck.hands or len(self.the_deck.hands[username]) == 0:
            return '%s has no cards to discard.\n' % username

        result_string = ''

        discard_cards = []

        if len(args) == 0:
            for card in self.the_deck.hands[username]:
                discard_cards.append(card)

        for arg in args:
            if Utils.int_format(arg):
                card_index = int(arg) - 1
                if card_index not in range(0, len(self.the_deck.hands[username])):
                    result_string += '%d is out of bounds. %s holds cards numbered 1 to %d\n' % (
                        card_index + 1, username, len(self.the_deck.hands[username]))
                elif not self.the_deck.hands[username][card_index] in discard_cards:
                    discard_cards.append(self.the_deck.hands[username][card_index])
            else:
                for card in self.the_deck.hands[username]:
                    if card.tag.lower() == arg.lower() and not card in discard_cards:
                        discard_cards.append(card)

        for discard_card in discard_cards:
            self.the_deck.discard(username, discard_card)
            result_string += '%s discards %s\n' % (username, discard_card.toString())

        if len(result_string) == 0:
            result_string = 'No matching cards in %s\'s hand' % (username)

        return result_string

    def discard_pile(self):
        result_string = 'Discard pile contains:\n'
        for i in range(0, len(self.the_deck.discard_pile)):
            discard = self.the_deck.discard_pile[i]
            result_string += '%d: %s\n' % (i, discard.toString())

        return result_string

    def shuffle(self, username):
        # if (username != self.config['DM']):
        #     return 'Only the DM (%s) may shuffle the deck' % (self.config['DM'])

        self.the_deck.shuffle()
        return '%s shuffles the deck' % (username)

    def cards_left(self):
        return '%d cards remain in the deck' % self.the_deck.cardsLeft()

    def tag(self, username, args):
        if len(args) < 2 or not Utils.int_format(args[0]):
            return self.TAG_MSG

        if not username in self.the_deck.hands:
            return username + ' has no cards to tag; aborting.'

        card_index = int(args[0])

        if card_index - 1 not in range(0, len(self.the_deck.hands[username])):
            return '%d is out of bounds. %s holds cards numbered 1 to %d' % (
                card_index, username, len(self.the_deck.hands[username]))

        tag = ''
        for i in range(1, len(args)):
            if len(tag) > 0:
                tag += ' '
            tag += args[i]

        self.the_deck.hands[username][card_index - 1].tag = tag

        return '%s tags %s' % (username, self.the_deck.hands[username][card_index - 1].toString())

    def clear_tag(self, username, args):
        if username not in self.the_deck.hands:
            return '%s has no cards. Aborting.' % (username)

        target_cards = []

        result_string = ''

        if len(args) == 0:
            for i in range(0, len(self.the_deck.hands[username])):
                target_cards.add(i)
        else:
            for arg in args:
                if not Utils.int_format(arg):
                    result_string += 'Ignoring non-integer argument %s...\n' % arg
                elif int(arg) - 1 not in range(0, len(self.the_deck.hands[username])):
                    result_string += 'Ignoring out of bounds argument %s...\n' % arg
                else:
                    target_cards.add(int(arg) - 1)

        for target_card in target_cards:
            self.the_deck.hands[username][target_card].tag = ''
            result_string += '%s cleared tag from %s\n' % (
                username, self.the_deck.hands[username][target_card].toString())

        return result_string

    def planeshift(self, username, args):
        if username not in self.the_deck.hands:
            return '%s has no cards. Aborting.' % (username)

        planeshifts = {}
        result_string = ''

        if len(args) == 0:
            return 'No cards or planes specified; aborting planeshift.'

        for arg in args:
            if Utils.int_format(arg) and int(arg) not in planeshifts.keys():
                card = self.the_deck.hands[username][int(arg) - 1]
                planeshifts[card] = ''
            elif arg.lower() in self.planes:
                for card in planeshifts:
                    if planeshifts[card] == '':
                        planeshifts[card] = arg.lower()

        for card in planeshifts:
            dest_plane = planeshifts[card]
            if dest_plane == '':
                result_string += 'No destination plane given for %s, skipping...\n' % card.toString()
                continue

            for plane in self.planes:
                print(self.planes[plane])
                if card.num in self.planes[plane]:
                    self.planes[plane].remove(card.num)
                    break

            self.planes[dest_plane].add(card.num)
            result_string += '%s planeshifted to %s\n' % (card.toString(), dest_plane)

        return result_string

    def get_plane(self, card_num):
        if card_num in self.planes['meatspace']:
            return 'meatspace'
        elif card_num in self.planes['astral']:
            return 'astral'
        elif card_num in self.planes['matrix']:
            return 'matrix'
        else:
            return ''

    def usage(self):
        return_me = ''
        for usage_msg in self.usage_messages:
            return_me += usage_msg
        return return_me
