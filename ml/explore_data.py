# Look at the MotionSense dataset - made by Rohan
# Run it from the ml folder: python explore_data.py

import os

import matplotlib.pyplot as plt
import pandas as pd

DATA_FOLDER = os.path.join('data', 'A_DeviceMotion_data')

# each folder name starts with a short code for the activity, e.g. wlk_7 = walking (trial 7)
ACTIVITY_NAMES = {
    'dws': 'downstairs',
    'ups': 'upstairs',
    'wlk': 'walk',
    'jog': 'jog',
    'sit': 'sit',
    'std': 'stand',
}

# 1. Which folders are there?
folders = []
for name in sorted(os.listdir(DATA_FOLDER)):
    if '_' in name: # skip anything that isn't an activity folder
        folders.append(name)
print('Activity folders:', folders)

# 2. Open one file and look at it
example = pd.read_csv(os.path.join(DATA_FOLDER, 'wlk_7', 'sub_1.csv'))
print()
print('Columns:', list(example.columns))
print('Rows in wlk_7/sub_1.csv:', len(example))
print('That is', round(len(example) / 50), 'seconds, because the phone recorded 50 times per second')
print()
print(example.head())

# 3. How much data do we have for each activity?
seconds_per_activity = {}
people = set()
for folder in folders:
    activity = ACTIVITY_NAMES[folder.split('_')[0]]
    for file in os.listdir(os.path.join(DATA_FOLDER, folder)):
        people.add(file)
        rows = len(pd.read_csv(os.path.join(DATA_FOLDER, folder, file)))
        seconds_per_activity[activity] = seconds_per_activity.get(activity, 0) + rows / 50

print()
print('Number of people:', len(people))
print('Minutes of data per activity:')
for activity, seconds in seconds_per_activity.items():
    print(' ', activity, round(seconds / 60), 'minutes')

# 4. Draw 5 seconds of walking and jogging for person 1, to see the difference
walk = pd.read_csv(os.path.join(DATA_FOLDER, 'wlk_7', 'sub_1.csv')).head(250)
jog = pd.read_csv(os.path.join(DATA_FOLDER, 'jog_9', 'sub_1.csv')).head(250)
seconds = [i / 50 for i in range(250)]

plt.figure(figsize=(10, 5))
plt.plot(seconds, walk['userAcceleration.y'], label='walk')
plt.plot(seconds, jog['userAcceleration.y'], label='jog')
plt.xlabel('time (seconds)')
plt.ylabel('acceleration y (g)')
plt.title('Walking vs jogging - phone in the front pocket')
plt.legend()

os.makedirs('figures', exist_ok=True)
plt.savefig(os.path.join('figures', 'walk_vs_jog.png'))
print()
print('Saved the picture to figures/walk_vs_jog.png')
