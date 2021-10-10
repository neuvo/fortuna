dbname = 'data/fortunecookies.db'
newname = 'data/cookies.db'

db = open(dbname)
newname = open(newname, 'a')

counter = 0
for line in db:
    if line != '\n':
        print(line)
        newname.write(line)
        counter += 1

print('all done! wrote %d lines' % counter)