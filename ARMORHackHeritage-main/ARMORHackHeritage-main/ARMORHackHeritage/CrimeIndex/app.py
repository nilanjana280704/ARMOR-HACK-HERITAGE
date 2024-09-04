import streamlit as st
import folium
from streamlit_folium import st_folium
import pandas as pd

st.title('Crime Against Women Index - Kolkata')

df_filtered = pd.read_csv('Final.csv')

station_names = df_filtered['Police Station Name'].tolist()
selected_station = st.selectbox("Select a Police Station", station_names)

selected_row = df_filtered[df_filtered['Police Station Name'] == selected_station].iloc[0]

st.write(f"**Crime Against Women Index for {selected_station}:** {selected_row['Crime Against Women Index']}")

st.image('output.png')

# Create a folium map
m = folium.Map(location=[22.526493, 88.332369], zoom_start=13)

# Add markers to the map
for index, row in df_filtered.iterrows():
    folium.Marker(
        location=[row['Latitude'], row['Longitude']],
        popup=row['Police Station Name'],
        icon=folium.Icon(color=row['Crime Against Women Index'].lower())
    ).add_to(m)

# Display the map in Streamlit

st.write("**Interactive Map Showing Crime Index**")

st_folium(m, width=700, height=500)

