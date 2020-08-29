class Varrick:
    def __init__(self,dbpath):
        self.dbpath = dbpath
        self.nicknames = {}
        fo = open(dbpath)
        for line in fo:
            line = line.rstrip()
            pair = line.split(' ')

            if len(pair) == 2:
                self.giveNick(pair[0],pair[1])

    def getNick(self,name):
        if name in self.nicknames:
            return self.nicknames[name]
        else:
            return name

    def giveNick(self,name,nick):
        if len(name) == 0 or len(nick) == 0:
            return 'Nicknames cannot be empty'
        else:
            for user in self.nicknames:
                if self.nicknames[user] == nick:
                    return nick + ' is already taken'

        # pair is valid
        self.nicknames[name] = nick

    def removeNick(self,name):
        if name in self.nicknames:
            self.nicknames.pop(name)
            return name + ' is no longer nicknamed'
        else:
            return name + ' already has no nickname'