# unclean version with refs
# testing 2 models fairly: train on 23 people test on the 1 person left out n repeat for all 24
# run it from the ml folder: python evaluate.py
# this needs data/windows.csv and that wsa generated when i tested running prepare_data.py.. 
# since data/ is in gitignore, it didnt get commited..
 
'''
now main idea here is:
- the WRONG way: mix all windows and split randomly 80/20.. then windows of the SAAMMEEE person end up in train n test
and the model just remembers how that person walks -> super high score that means nothing for a new player!!!
- the RIGHT way = leave one person out: 24 rounds, each round tests on a person the model has never seen
  just like a new player using our game. sklearn has LeaveOneGroupOut for this so group = person in here case
- cross_val_predict gives 1 prediction per window, each one made by the model that did not see that person
- then picking the model by its SCORE same rule as my step counter in assignment 1:
  i tested many wndw sizes against my ground truth of 100 steps and kept the one that counted best
 
2 models:
- kNN (k=5): looks at the 5 most similar wndws n takes the majority.. needs StandardScaler first
  bcoz the features have very different ranges (acc in g vs gyro in rad/s) aannnddd kNN uses distances
- random forest: 100 small decision trees that vote.. min_samples_leaf=5 so a tree cant make a rule from 1-2 wndws
  so less overfitting and doesnt need scaling..
 
score = macro F1 = F1 of every activity, then the plain avg
so stairs whihc r small classes get counted as much as still which ae biggest class.. plain accuracy would hide bad stairs
ref1: https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.LeaveOneGroupOut.html
ref2: https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.cross_val_predict.html
ref3: https://scikit-learn.org/stable/modules/generated/sklearn.metrics.f1_score.html
ref4: https://scikit-learn.org/stable/modules/generated/sklearn.metrics.ConfusionMatrixDisplay.html
'''

import os
 
import matplotlib.pyplot as plt
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import ConfusionMatrixDisplay, classification_report, f1_score
from sklearn.model_selection import LeaveOneGroupOut, cross_val_predict
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
 
from features import FEATURE_NAMES
 
table = pd.read_csv(os.path.join('data', 'windows.csv'))
# the 40 nos, right ans and who recorded for each window
X = table[FEATURE_NAMES].values
y = table['label'].values
people = table['person'].values
 
# thenn 24 rounds, 1 per person
leave_one_person_out = LeaveOneGroupOut()
 
models = {
    # pipeline = first scale, then kNN.. so the scaling will also b learned only from the 23 training people each round
    'kNN (k=5)': make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=5)),
    # random_state=0 so we all get the same score on our own laptops, n_jobs=-1 = use all cpu cores nd this is faster
    'Random forest': RandomForestClassifier(n_estimators=100, min_samples_leaf=5, random_state=0, n_jobs=-1),
}
 
best_name = None
best_score = 0
best_predictions = None
 
for name, model in models.items():
    print('Testing', name, '...')
    predictions = cross_val_predict(model, X, y, groups=people, cv=leave_one_person_out)
    score = f1_score(y, predictions, average='macro')
    print('  macro F1 =', round(score, 3))
    if score > best_score:
        best_name = name
        best_score = score
        best_predictions = predictions
 
print()
print('Best model:', best_name, '- macro F1', round(best_score, 3))
# precision, recall n F1 for every activity.. this tells us which activities are hard
print(classification_report(y, best_predictions, digits=3))
 
# now in confusion matrix: rows = what really happened, cols = what the model said
# normalize='true' so every row adds up to 1 bcoz this is easy to read as "out of all walking windows 87% said walk"
ConfusionMatrixDisplay.from_predictions(y, best_predictions, normalize='true', values_format='.2f')
plt.title(best_name + ' - leave one person out')
plt.tight_layout()
os.makedirs('figures', exist_ok=True)
plt.savefig(os.path.join('figures', 'confusion_matrix.png'))
print('Saved the picture to figures/confusion_matrix.png')



# after running this is the output:
'''
(.venv) PS C:\D\CS7470-Team12\ml> python evaluate.py
Testing kNN (k=5) ...
  macro F1 = 0.852
Testing Random forest ...
  macro F1 = 0.879

Best model: Random forest - macro F1 0.879
              precision    recall  f1-score   support

  downstairs      0.753     0.796     0.774      1952
         jog      0.960     0.960     0.960      2025
       still      0.998     0.999     0.999      9937
    upstairs      0.755     0.835     0.793      2350
        walk      0.902     0.838     0.869      5275

    accuracy                          0.920     21539
   macro avg      0.874     0.886     0.879     21539
weighted avg      0.922     0.920     0.920     21539

Saved the picture to figures/confusion_matrix.png
(.venv) PS C:\D\CS7470-Team12\ml> 
'''

# knn macro f1: 0.852
# random forest f1: 0.879
# best model is randome forest as it has f1 = 0.879 which is greater than knn's f1
# accuracy for random forest is 0.920 (which a good acc, not underfitting and not overfitting)
# and then saved the pic of confusion matrix to figures so taht we can show it in demo vid and report..
