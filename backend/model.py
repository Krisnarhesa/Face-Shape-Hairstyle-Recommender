import torch
import torch.nn as nn
import timm

CLASSES = ['Heart', 'Oblong', 'Oval', 'Round', 'Square']

def load_model(model_path):
    model = timm.create_model(
        "efficientnet_b4",
        pretrained=False
    )

    in_features = model.classifier.in_features

    model.classifier = nn.Sequential(
        nn.Dropout(0.4),
        nn.Linear(in_features, len(CLASSES))
    )

    state = torch.load(model_path, map_location="cpu")
    model.load_state_dict(state)
    model.eval()

    return model
