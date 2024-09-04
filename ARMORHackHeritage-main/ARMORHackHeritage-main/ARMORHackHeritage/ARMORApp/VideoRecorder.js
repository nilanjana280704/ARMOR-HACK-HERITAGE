// VideoRecorder.js
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

export const openCamera = async () => {
  const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
  const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
  
  if (!cameraPermission.granted || mediaLibraryPermission.status === 'denied') {
    Alert.alert("Camera and media library permissions are required!");
    return;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    allowsEditing: true,
    aspect: [16, 9],
    quality: 1,
    videoMaxDuration: 60,
  });

  if (!result.canceled) {
    const asset = await MediaLibrary.createAssetAsync(result.assets[0].uri);
    await MediaLibrary.createAlbumAsync("MyVideos", asset, false);
    console.log("Video saved to gallery");
  }
};
