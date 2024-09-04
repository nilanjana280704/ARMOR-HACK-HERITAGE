import streamlit as st
import cv2
import numpy as np
from tensorflow.keras.models import load_model
import numpy as np

# Title of the app
st.title("ECG Image Prediction")

# Add a file uploader widget
uploaded_file = st.file_uploader("Choose an image...", type=["jpg", "png", "jpeg"])

# Check if a file has been uploaded
if uploaded_file is not None:
    # Read the image as a file buffer
    file_bytes = np.asarray(bytearray(uploaded_file.read()), dtype=np.uint8)
    
    # Decode the image using OpenCV
    image = cv2.imdecode(file_bytes, 1)
    
    # Convert BGR to RGB since OpenCV reads images in BGR format
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Display the image using Streamlit
    st.image(image, caption='Uploaded Image.', use_column_width=True)

    model = load_model('vgg16_binary_classification_model.h5')
    img = cv2.resize(image,(200,200),interpolation=cv2.INTER_AREA)
    img = (img - img.min())/(img.max() - img.min())
    img = np.reshape(img,[1,200,200,3])
    prediction = model.predict(img)
    st.write("Percentage of Signal being abnormal : " + str(prediction[0][0]*100))
else:
    st.write("Please upload an image to display.")
