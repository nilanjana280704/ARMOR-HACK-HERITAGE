import cv2
import numpy as np
from ultralytics import YOLO
import mediapipe as mp
import time
import geocoder
from datetime import datetime

# Load the YOLOv8 model pre-trained on the COCO dataset
model = YOLO('yolov8n.pt')

# Define the class ID for "person" in the COCO dataset
person_class_id = 0  # COCO class ID for "person"

# Load the pre-trained gender classification model
gender_net = cv2.dnn.readNetFromCaffe(
    'deploy_gender.prototxt',  # Path to the gender model's architecture
    'gender_net.caffemodel'    # Path to the gender model's weights
)
gender_list = ['Male', 'Female']

# Initialize the video capture object
cap = cv2.VideoCapture(0)

# Initialize MediaPipe Hands and Face Mesh
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=False, max_num_hands=2, min_detection_confidence=0.5)
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(max_num_faces=1)

# Function to classify gender with enhanced error handling
def classify_gender(face_img):
    try:
        blob = cv2.dnn.blobFromImage(face_img, 1.0, (227, 227), 
                                     (78.4263377603, 87.7689143744, 114.895847746), 
                                     swapRB=False)
        gender_net.setInput(blob)
        gender_preds = gender_net.forward()
        gender = gender_list[gender_preds[0].argmax()]
        confidence = gender_preds[0].max()
        return gender, confidence
    except Exception as e:
        print(f"Gender classification error: {e}")
        return "Male", 1.0  # Default to Male if there is an error

# Function to detect thumbs up gesture
def detect_thumbs_up(hand_landmarks):
    if hand_landmarks:
        for landmarks in hand_landmarks:
            thumb_tip = landmarks.landmark[mp_hands.HandLandmark.THUMB_TIP]
            thumb_ip = landmarks.landmark[mp_hands.HandLandmark.THUMB_IP]
            thumb_mcp = landmarks.landmark[mp_hands.HandLandmark.THUMB_MCP]
            thumb_cmc = landmarks.landmark[mp_hands.HandLandmark.THUMB_CMC]
            index_tip = landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP]
            index_dip = landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_DIP]
            
            if (thumb_tip.y < thumb_ip.y < thumb_mcp.y < thumb_cmc.y) and (index_tip.y > index_dip.y):
                return True
    return False

# Function to detect punch gesture
def detect_punch(hand_landmarks):
    if hand_landmarks:
        for landmarks in hand_landmarks:
            thumb_tip = landmarks.landmark[mp_hands.HandLandmark.THUMB_TIP]
            index_tip = landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP]
            middle_tip = landmarks.landmark[mp_hands.HandLandmark.MIDDLE_FINGER_TIP]
            ring_tip = landmarks.landmark[mp_hands.HandLandmark.RING_FINGER_TIP]
            pinky_tip = landmarks.landmark[mp_hands.HandLandmark.PINKY_TIP]
            
            if (thumb_tip.y < index_tip.y and thumb_tip.y < middle_tip.y and
                thumb_tip.y < ring_tip.y and thumb_tip.y < pinky_tip.y):
                return True
    return False

# Function to detect holding weapon gesture
def detect_holding_weapon(hand_landmarks):
    if hand_landmarks:
        for landmarks in hand_landmarks:
            thumb_tip = landmarks.landmark[mp_hands.HandLandmark.THUMB_TIP]
            index_tip = landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP]
            middle_tip = landmarks.landmark[mp_hands.HandLandmark.MIDDLE_FINGER_TIP]
            ring_tip = landmarks.landmark[mp_hands.HandLandmark.RING_FINGER_TIP]
            pinky_tip = landmarks.landmark[mp_hands.HandLandmark.PINKY_TIP]
            
            if (thumb_tip.y < index_tip.y and middle_tip.y < thumb_tip.y and
                ring_tip.y < thumb_tip.y and pinky_tip.y < thumb_tip.y):
                return True
    return False

# Function to detect push gesture
def detect_push(hand_landmarks, previous_landmarks):
    if hand_landmarks and previous_landmarks:
        for landmarks, prev_landmarks in zip(hand_landmarks, previous_landmarks):
            thumb_tip = landmarks.landmark[mp_hands.HandLandmark.THUMB_TIP]
            prev_thumb_tip = prev_landmarks.landmark[mp_hands.HandLandmark.THUMB_TIP]
            index_tip = landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP]
            prev_index_tip = prev_landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP]

            # Calculate the movement of the hand
            thumb_movement = thumb_tip.x - prev_thumb_tip.x
            index_movement = index_tip.x - prev_index_tip.x

            # Simple heuristic: if hand extends outward
            if thumb_movement > 0.1 and index_movement > 0.1:
                return True
    return False

# Function to draw landmarks and connections on the face and hand
def draw_landmarks(frame, hand_landmarks, face_landmarks):
    # Draw hand landmarks
    if hand_landmarks:
        for hand_landmark in hand_landmarks:
            for idx, landmark in enumerate(hand_landmark.landmark):
                x = int(landmark.x * frame.shape[1])
                y = int(landmark.y * frame.shape[0])
                cv2.circle(frame, (x, y), 5, (0, 255, 0), -1)
                
            # Draw connections between hand landmarks
            mp.solutions.drawing_utils.draw_landmarks(frame, hand_landmark, mp_hands.HAND_CONNECTIONS)

    # Draw face landmarks
    if face_landmarks:
        for idx, landmark in enumerate(face_landmarks.landmark):
            x = int(landmark.x * frame.shape[1])
            y = int(landmark.y * frame.shape[0])
            cv2.circle(frame, (x, y), 2, (0, 255, 0), -1)
        
        # Draw connections between face landmarks
        mp.solutions.drawing_utils.draw_landmarks(frame, face_landmarks, mp_face_mesh.FACEMESH_CONTOURS)

# Function to count, classify, and draw bounding boxes
def count_draw_and_detect(frame, detections, previous_hand_landmarks):
    men_count = 0
    women_count = 0
    thumbs_up_count = 0
    push_count = 0
    punch_count = 0
    location_displayed = False

    # Analyze hand and face landmarks
    hand_results = hands.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    face_results = face_mesh.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    
    if hand_results.multi_hand_landmarks:
        if detect_push(hand_results.multi_hand_landmarks, previous_hand_landmarks):
            push_count += 1
            cv2.putText(frame, 'Push Detected', (10, 290), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 255), 2)
        
        if detect_thumbs_up(hand_results.multi_hand_landmarks):
            thumbs_up_count += 1
            cv2.putText(frame, 'SOS Detected', (10, 190), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
                
            if not location_displayed:
                # Get the current location and time
                g = geocoder.ip('me')
                location = g.latlng
                current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                
                # Display the location and time on the screen
                location_text = f'Location: {location[0]:.4f}, {location[1]:.4f}'
                time_text = f'Time: {current_time}'
                cv2.putText(frame, location_text, (10, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)
                cv2.putText(frame, time_text, (10, 190), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)
                location_displayed = True
        
        if detect_punch(hand_results.multi_hand_landmarks):
            punch_count += 1
            cv2.putText(frame, 'Punch Detected', (10, 330), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
    
    # Draw face and hand landmarks
    if hand_results.multi_hand_landmarks or face_results.multi_face_landmarks:
        draw_landmarks(frame, hand_results.multi_hand_landmarks, face_results.multi_face_landmarks[0] if face_results.multi_face_landmarks else None)

    for detection in detections:
        class_id = int(detection[5])  # Extract the class ID
        if class_id == person_class_id:
            x1, y1, x2, y2 = map(int, detection[:4])
            face_img = frame[y1:y2, x1:x2]
            gender, _ = classify_gender(face_img)  # We ignore the confidence score

            if gender == 'Male':
                men_count += 1
                label = 'Man'
                color = (255, 0, 0)
            elif gender == 'Female':
                women_count += 1
                label = 'Woman'
                color = (0, 0, 255)

            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)

    return men_count, women_count, thumbs_up_count, push_count, punch_count, hand_results.multi_hand_landmarks

# Main video processing loop
previous_hand_landmarks = None
while True:
    start_time = time.time()
    
    ret, frame = cap.read()
    if not ret:
        break

    results = model(frame)
    detections = results[0].boxes.data.cpu().numpy()

    men_count, women_count, thumbs_up_count, push_count, punch_count, current_hand_landmarks = count_draw_and_detect(frame, detections, previous_hand_landmarks)

    cv2.putText(frame, f'Men: {men_count}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
    cv2.putText(frame, f'Women: {women_count}', (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    cv2.putText(frame, f'SOS: {thumbs_up_count}', (10, 110), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    cv2.putText(frame, f'Push: {push_count}', (10, 150), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
    cv2.putText(frame, f'Punch: {punch_count}', (10, 190), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

    if men_count >= 3 and women_count == 1:
        cv2.putText(frame, "Dangerous Situation", (50, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)

    if men_count >= 5 and women_count == 1:
        cv2.putText(frame, "SOS Situation", (50, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)

    cv2.imshow('YOLOv8 Webcam Detection', frame)

    # Update previous landmarks
    previous_hand_landmarks = current_hand_landmarks

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
