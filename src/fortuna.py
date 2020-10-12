import discord
import asyncio
from discord.ext.commands import Bot
from discord.ext import commands
from discord import Status
import platform
import random
from enum import Enum
from functools import reduce
from PlayingCards import Deck
from Die import Die
import Utils
import SavageWorlds
from Joke import FortuneCookie
from Varrick import Varrick

import operator as op
def nCr(n, r):
    r = min(r, n-r)
    numer = reduce(op.mul, range(n, n-r, -1), 1)
    denom = reduce(op.mul, range(1, r+1), 1)
    return numer//denom

TOKEN = open('../data/token.cfg').readline()

client = Bot(description="Fortuna: a dice assistant by neuvo#1301", command_prefix="/", pm_help = True)

USAGE_MSG = "Usage: %sroll <num dice> <difficulty>" % client.command_prefix

USAGE_MSG_SR = "Usage: %sroll <num dice>" % client.command_prefix

USAGE_MSG_SW = ('Usage: %sroll <die1> <optional:die2> <optional:mod>\nExample: %sroll 1d8 1d6 +2\nNote: mod must have a + or a - in front. Dice and mods may be in any order.\n' % (client.command_prefix,client.command_prefix))

# to be used only for testing. Users shouldn't see this message.
ERROR_MSG = "Incorrectly formatted input\n"

class Game(Enum):
    mageTheAscension=1
    strikeLegion=2
    pathfinder=3
    shadowrun=4
    savageWorlds=5

GAMES = { Game.mageTheAscension:"Mage: The Ascension", Game.strikeLegion:"Strike Legion", Game.pathfinder:"Pathfinder",
    Game.shadowrun:"Shadowrun", Game.savageWorlds:"Savage Worlds" }

DEFAULT_GAME = Game.savageWorlds

current_game = DEFAULT_GAME

savageWorlds = SavageWorlds.Game(client.command_prefix)

fortuneCookie = FortuneCookie()

varrick = Varrick('../data/nicknames.db')

# rolls a set of dice with the given number of sides
# adds all the given modifiers
# sums the result
# intended for use in Pathfinder, D&D, and similar d20 systems
def roll_dice_sum(num, sides, mods):
    # stores the complete result string, to be posted in the chat
    result_string = ""

    # track the sum of all rolls
    total = 0

    # perform all the rolls, tally the total
    for i in range(num):
        result = random.randint(1, sides)
        outstring = "Roll %d: %d" % (i+1, result)
        result_string += outstring + '\n'
        total += result

    # add the modifiers to the total
    # for i in mods:
        # total += mods[i]

    total += mods

    result_string += "Total: %d\n" % total

    return result_string

# rolls a set of dice versus a given difficulty
# results matching or exceeding the difficulty succeed
# 1's count against the running total
# max value rolls automatically succeed
# if no rolls succeed, the result is a fumble
# based on Mage: The Ascension rolling rules
# works just as well for Strike Legion
def roll_dice_diff(num, sides, diff):

    # stores the complete result string, to be posted in the chat
    result_string = ""

    # tracks the total number of successes
    succ = 0

    # tracks whether or not the player has fumbled
    fumble = True

    # perform all the rolls
    # use + to indicate success, - to indicate failure (natural 1)
    for i in range(num):
        result = random.randint(1, sides)
        outstring = "Roll %d: %d" % (i+1, result)
        if result == 1:
            succ -= 1
            outstring += "-"
        elif result >= diff or result == sides:
            succ += 1
            outstring += "+"
            fumble = False

        result_string += outstring + '\n'

    succ_string = "%d success" % succ
    if succ != 1:
        succ_string += "es"

    result_string += succ_string + '\n'

    if fumble:
        result_string += "Fumbled!\n"
    elif succ <= 0:
        result_string += "Didn't fumble!\n"

    return result_string

# Performs tests in the D6 system. Intended for use with Shadowrun 5e.
# Num: the number of dice to roll.
def roll_dice_d6(num):
    # stores the complete result string, to be posted in the chat
    result_string = ""

    # tracks the total number of hits
    hits = 0

    # tracks how many glitches have occurred
    ones = 0

    # perform all the rolls
    # use + to indicate hits, - to indicate ones
    for i in range(num):
        result = random.randint(1, 6)
        outstring = "Roll %d: %d" % (i+1, result)
        if result == 1:
            ones += 1
            outstring += "-"
        elif result >= 5:
            hits += 1
            outstring += "+"

        result_string += outstring + '\n'

    hits_string = "%d hit" % hits
    if hits != 1:
        hits_string += "s"

    glitch_string = "%d one" % ones
    if ones != 1:
        glitch_string += "s"
    
    result_string += hits_string + '\n'
    result_string += glitch_string + '\n'

    return result_string

def roll_dreidel(num):
    # stores the complete result string, to be posted in the chat
    results = []
    mapping = {0:"assets/nun.png", 1:"assets/gimel.png", 2:"assets/hay.png", 3:"assets/shin.png"}
    result = random.randint(0,3)

    # perform all the rolls
    # use + to indicate hits, - to indicate ones
    for i in range(num):
        results.append(mapping[random.randint(0, 3)])

    return results

def get_name(ctx):
    return str(varrick.getNick(str(ctx.message.author)))

# Prints basic information to console and sets presence on Discord
@client.event
async def on_ready():
    print('Logged in as '+client.user.name+' (ID:'+str(client.user.id)+') \nConnected to '+str(len(set(client.get_all_members())))+' users')
    print('--------')
    print('Current Discord.py Version: {} | Current Python Version: {}'.format(discord.__version__, platform.python_version()))
    print('--------')
    print('Use this link to invite {}:'.format(client.user.name))
    print('https://discordapp.com/oauth2/authorize?client_id={}&scope=bot&permissions=8'.format(client.user.id))
    print('--------')
    print('You are running ' + client.user.name + 'v2.1')
    print('Created by neuvo#1301')
    return await client.change_presence(activity=discord.Game(name=GAMES[DEFAULT_GAME]))

# Roll command: rolls a specified number and type of dice
# Exact behavior depends on game mode
# Prints results to console
@commands.command(pass_context=True)
async def roll(ctx, *args):
    if len(args) > 0 and args[0] == 'dreidel':
        num = 1
        try:
            if len(args) >= 2:
                num = int(args[1])
        except ValueError:
            num = 1

        results = roll_dreidel(num);
        for result in results:
            await ctx.send(str(varrick.getNick(str(ctx.message.author))) + ' rolls:')
            await ctx.send(file=discord.File(result))
    elif current_game == Game.savageWorlds:
        await ctx.send(savageWorlds.roll(str(varrick.getNick(str(ctx.message.author))), args))
    elif current_game != Game.shadowrun:
        if len(args) != 2:
            await ctx.send(USAGE_MSG)
            return

        nds = args[0]
        diff = int(args[1])
        d_index = nds.find('d')
        num = 0
        sides = 10

        # if the user did not specify number of dice, assume 1
        if d_index == 0:
            num = 1
            sides = int(nds[d_index+1:])
        # if the user did not specify the number of sides but still typed 'd', assume sides=10
        elif d_index == len(nds)-1:
            await ctx.send("Number of sides unspecified, assuming d10")
            num = int(nds[:d_index])
        # if the user specified the number of sides, then we adapt to that
        elif d_index != -1 and d_index > 0:
            num = int(nds[:d_index])
            sides = int(nds[d_index+1:])
        # default: user did not specify number of sides, assume 10
        elif d_index == -1:
            num = int(nds)

        if current_game == Game.mageTheAscension or current_game == Game.strikeLegion:
            await ctx.send("%s rolls %dd%d, difficulty %d" % (varrick.getNick(str(ctx.message.author)), num, sides, diff))
            await ctx.send(roll_dice_diff(num, sides, diff))
        elif current_game == Game.pathfinder:
            await ctx.send("%s rolls %dd%d, with %d bonus" % (varrick.getNick(str(ctx.message.author)), num, sides, diff))
            await ctx.send(roll_dice_sum(num, sides, diff))
    else:
        if len(args) != 1:
            await ctx.send(USAGE_MSG_SR)
            return

        num = int(args[0])

        await ctx.send("%s rolls %dd6" % (varrick.getNick(str(ctx.message.author)), num))
        await ctx.send(roll_dice_d6(num))

@commands.command(pass_context=True)
async def analyze(ctx, *args):
    if current_game == Game.shadowrun:
        outstring = ""
        pwin = 1.0/3.0
        ploss = 2.0/3.0

        if len(args) == 1:
            nd6 = int(args[0])
            for thresh in range(1, nd6+1):
                p = 0.0

                for i in range(thresh, nd6+1):
                    p += nCr(nd6, i) * pow(pwin, i) * pow(ploss, nd6-i)

                if (p < 0.000001):
                    break

                outstring += ("P(%d+ successes with %d rolls) = %f\n" % (thresh, nd6, p))

            await ctx.send(outstring)
        elif len(args) == 2:
            nd6 = int(args[0])
            thresh = int(args[1])

            p = 0.0

            for i in range(thresh, nd6+1):
                p += nCr(nd6, i) * pow(pwin, i) * pow(ploss, nd6-i)

            await ctx.send("P(%d+ successes with %d rolls) = %f" % (thresh, nd6, p))
        else:
            await ctx.send(USAGE_MSG_SR)
            return

# Updates the current game
# This affects dice rolling behavior
@commands.command(pass_context=True)
async def setgame(ctx, *args):
    global current_game
    # combine all input args to form a game name
    game_name = ""

    for arg in args:
        game_name += arg + " "

    game_name = game_name[0:-1]

    # check if the game name is a string
    if not isinstance(game_name,str):
        await ctx.send(str(game_name) + " isn't a string! How'd you manage that with a keyboard?\n")
        return

    # check if the game exists
    # if so, switch to it
    # if not, suggest other options
    # TODO: make it suggest the closest match
    if game_name in GAMES.values():
        for key in GAMES.keys():
            if GAMES[key] == game_name:
                current_game = key
                await ctx.send("Now playing " + game_name + "\n")
                return await client.change_presence(status=Status.online, activity=discord.Game(name=GAMES[current_game]))
    else:
        await ctx.send("I don't know how to play " + game_name + "!\n")
        help_string = "I only know how to play: "

        for game in GAMES.values():
            help_string += str(game) + ", "

        await ctx.send(help_string[0:-2] + "\n")

@commands.command(pass_context=True)
async def draw(ctx, *args):
    if current_game != Game.savageWorlds:
        await ctx.send('draw not supported in current game system.')
        return

    num_cards = 1
    tag = ''
    num_start = 0
    tag_start = 0
    plane = 'meatspace'

    if len(args) > 0 and not Utils.int_format(args[0]) and args[0].lower() in savageWorlds.get_plane_names():
        plane = args[0].lower()
        num_start += 1
        tag_start += 1

    if num_start < len(args) and len(args) > 0 and Utils.int_format(args[num_start]):
        num_cards = int(args[num_start])
        tag_start += 1

    if tag_start < len(args):
        tag = args[tag_start]

    for i in range(tag_start+1,len(args)):
        tag = tag + ' ' + args[i]

    await ctx.send(savageWorlds.draw(str(varrick.getNick(str(ctx.message.author))), plane, num_cards, tag))

@commands.command(pass_context=True)
async def shuffle(ctx, *args):
    if current_game == Game.savageWorlds:
        await ctx.send(savageWorlds.shuffle(str(ctx.message.author)))
    else:
        await ctx.send('hand not supported in current game system.')

@commands.command(pass_context=True)
async def hand(ctx, *args):
    if not current_game == Game.savageWorlds:
        await ctx.send('hand not supported in current game system.')
        return

    if len(args) == 1 and len(args[0]) > 0:
        await ctx.send(savageWorlds.hand(str(args[0])))
    else:
        await ctx.send(savageWorlds.hand(str(varrick.getNick(str(ctx.message.author)))))

@commands.command(pass_context=True)
async def discard(ctx, *args):
    if not current_game == Game.savageWorlds:
        await ctx.send('draw not supported in current game system.')
    else:
        await ctx.send(savageWorlds.discard(str(varrick.getNick(str(ctx.message.author)))))

@commands.command(pass_context=True)
async def countdown(ctx, *args):
    if current_game == Game.savageWorlds:
        await ctx.send(savageWorlds.countdown(args))
    else:
        await ctx.send('countdown not supported in current game system.')

@commands.command(pass_context=True)
async def cardsleft(ctx):
    if current_game == Game.savageWorlds:
        await ctx.send(savageWorlds.cardsleft())
    else:
        await ctx.send('cardsleft not supported in current game system.')

@commands.command(pass_context=True)
async def trade(ctx, *args):
    if current_game == Game.savageWorlds:
        await ctx.send()

@commands.command(pass_context=True)
async def cookie(ctx, *args):
    numFortunes = 1
    if len(args) == 1:
        try:
            numFortunes = int(args[0])
            await ctx.send(fortuneCookie.eat(numFortunes))
        except ValueError:
            await ctx.send('Invalid value \"%s\"\n' % args[0])
            return

    await ctx.send('%s gets: %s' % (str(varrick.getNick(str(ctx.message.author))), fortuneCookie.eat(numFortunes)))

@commands.command(pass_context=True)
async def discard(ctx, *args):
    await ctx.send(savageWorlds.discard(get_name(ctx),args))

@commands.command(pass_context=True)
async def tag(ctx, *args):
    await ctx.send(savageWorlds.tag(get_name(ctx), args))

@commands.command(pass_context=True)
async def cleartag(ctx, *args):
    await ctx.send(savageWorlds.clear_tag(get_name(ctx), args))

@commands.command(pass_context=True)
async def planeshift(ctx, *args):
    await ctx.send(savageWorlds.planeshift(get_name(ctx), args))

# Usage command: 
@commands.command()
async def usage(ctx):
    if current_game == Game.savageWorlds:
        await ctx.send(savageWorlds.usage())
    else:
        await ctx.send(USAGE_MSG)

client.add_command(analyze)
client.add_command(cardsleft)
client.add_command(cleartag)
client.add_command(cookie)
client.add_command(countdown)
client.add_command(discard)
client.add_command(draw)
client.add_command(hand)
client.add_command(planeshift)
client.add_command(roll)
client.add_command(setgame)
client.add_command(shuffle)
client.add_command(tag)
client.add_command(usage)

client.run(TOKEN)
