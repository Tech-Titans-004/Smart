js = open('test.js').read()
chunks = js.split('')
print(len(chunks))
if len(chunks) % 2 == 0: print('UNBALANCED')
