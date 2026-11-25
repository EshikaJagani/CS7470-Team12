# prepare_data.py - made by Eshika
# same here.. unclean version with refs as per the ed stem post
# cutting every MotionSense recording into 2.56 sec windows n working out the 40 features for each
# guys, we need to run it from the ml folder:  python prepare_data.py
# and it will make the file data/windows.csv (1 row per window)
# the sliding window idea is the same as my moving avg from ind assnmt 1 task 3b
 
'''
main idea here is:
- MotionSense = 24 people, iphone 6s in the FRONT POCKET, 50 readings per sec (same as our pocket mode!!)
- 1 folder per activity n trial like wlk_7 = walking trial 7, n inside 1 csv per person like sub_7.csv
- the folder code tells the activity n the file name tells the person
- sitting n standing both become "still" bcoz for our game they mean the same thing = thats not moving
  n with the phone in a pocket sit vs stand is hard to tell apart anyway..
- for every recording: slide a 128 window, moving 64 at a time -> make_features -> 1 row
- also saving WWWHHOOO recorded each window (person), so in evaluate.py we can leave 1 person out when testing
 
columns i use from the csv:
- userAcceleration.x/y/z = acc WITHOUT gravity, already in g
- rotationRate.x/y/z = gyro, already in radians per sec
so no unit change needed here as the server does the unit change for our phones
ref1: https://github.com/mmalekzadeh/motion-sense
ref2: https://pandas.pydata.org/docs/reference/api/pandas.read_csv.html
ref3: https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.to_csv.html
ref4: https://numpy.org/doc/stable/reference/generated/numpy.convolve.html (the 'valid' idea)
'''
 
import os
 
import pandas as pd
 
from features import FEATURE_NAMES, STEP_SIZE, WINDOW_SIZE, make_features
 
DATA_FOLDER = os.path.join('data', 'A_DeviceMotion_data')
 
# the activity for each folder code.. sit n std both become "still"
LABELS = {
    'dws': 'downstairs',
    'ups': 'upstairs',
    'wlk': 'walk',
    'jog': 'jog',
    'sit': 'still',
    'std': 'still',
}
 
all_rows = []
 
for folder in sorted(os.listdir(DATA_FOLDER)):
    # skipping anything that isnt an activity folder (like hidden files on mac lol)
    if '_' not in folder:
        continue
    # wlk_7 -> wlk -> walk
    label = LABELS[folder.split('_')[0]]
 
    for file in sorted(os.listdir(os.path.join(DATA_FOLDER, folder))):
        # sub_7.csv -> person 7
        person = int(file.replace('sub_', '').replace('.csv', ''))
        data = pd.read_csv(os.path.join(DATA_FOLDER, folder, file))
 
        acc = data[['userAcceleration.x', 'userAcceleration.y', 'userAcceleration.z']].values
        gyro = data[['rotationRate.x', 'rotationRate.y', 'rotationRate.z']].values
 
        # sliding the window along the recording, same main concept as my moving average in assignment 1:
        # take a window on a signal, and slide it through the signal
        # but there i moved 1 sample at a time n took the avg, here i move 64 at a time n take 40 nos
        # n like 'valid' in np.convolve, i only keep the positions where the window is fully inside the recording
        # so the last bit that is shorter than 128 is just dropped
        start = 0
        while start + WINDOW_SIZE <= len(data):
            features = make_features(acc[start : start + WINDOW_SIZE], gyro[start : start + WINDOW_SIZE])
            all_rows.append(features + [label, person])
            start = start + STEP_SIZE
 
    print('done', folder)
 
table = pd.DataFrame(all_rows, columns=FEATURE_NAMES + ['label', 'person'])
table.to_csv(os.path.join('data', 'windows.csv'), index=False)
 
print()
print('Windows made:', len(table))
# how many windows per activity.. still will be the biggest bcoz sit + std are merged
print(table['label'].value_counts())
print('Saved data/windows.csv')
