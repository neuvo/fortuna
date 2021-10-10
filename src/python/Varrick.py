import os


def parse_nick(*args):
    if len(args) != 1:
        return "Missing nickname"
    else:
        return ''


class Varrick:
    def __init__(self, dbpath):
        self.dbpath = dbpath
        self.nicknames = {}
        fo = open(dbpath)
        for line in fo:
            line = line.rstrip()
            pair = line.split(' ')

            if len(pair) == 2:
                self.give_nick(pair[0], pair[1])

        fo.close()

    def get_nick(self, name) -> str:
        if name in self.nicknames:
            return self.nicknames[name]
        else:
            return name

    def update_nick(self, ctx, *args) -> str:
        parse_output = parse_nick(args)

        if len(parse_output) > 0:
            return parse_output

        user = str(ctx.message.author)
        give_nick_output = self.give_nick(user, args[0])
        if len(give_nick_output) > 0:
            return give_nick_output
        self.save_nicknames()
        return user + ' updated nickname to ' + self.nicknames[user]

    def give_nick(self, name, nick) -> str:
        if len(name) == 0 or len(nick) == 0:
            return 'Nicknames cannot be empty'
        else:
            for user in self.nicknames:
                if self.nicknames[user] == nick:
                    return nick + ' is already taken'

        # pair is valid
        self.nicknames[name] = nick
        return ''

    def remove_nick(self, name) -> str:
        if name in self.nicknames:
            self.nicknames.pop(name)
            return name + ' is no longer nicknamed'
        else:
            return name + ' already has no nickname'

    def save_nicknames(self):
        fo = open(self.dbpath+'.tmp','w+')
        for name in self.nicknames:
            fo.write(name + ' ' + self.nicknames[name]+'\n')

        fo.close()

        os.replace(self.dbpath+'.tmp', self.dbpath)
