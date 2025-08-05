import * as ImagePicker from 'expo-image-picker';

export class SettingsBackgroundImagePicker {
  /**
   * Launches the system image picker and passes result to supplied callback.
   * @param onImagePicked Function to be called with the picker result.
   */
  async launchImagePicker(
    onImagePicked: (result: { canceled: boolean; uri?: string }) => Promise<void>
  ): Promise<void> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    // Map the new result shape to your callback type
    await onImagePicked({
      canceled: result.canceled,
      uri: !result.canceled && result.assets && result.assets.length > 0 ? result.assets[0].uri : undefined,
    });
  }

  /**
   * Validates image picker result and updates background image if valid, closes dialog if image is set.
   * @param result The result object from the image picker.
   * @param onSetBackgroundImage Callback to update the background image with uri.
   * @param onCloseDialog Callback to close the dialog.
   */
  async handleImagePicked(
    result: { canceled: boolean; uri?: string },
    onSetBackgroundImage: (uri: string) => Promise<void>,
    onCloseDialog: () => void
  ): Promise<void> {
    if (result.canceled || !result.uri) return;
    await onSetBackgroundImage(result.uri);
    onCloseDialog();
  }

  /**
   * Handles selection of a built-in background image.
   * @param imageRef Reference key or URI for the built-in image.
   * @param onSetBackgroundImage Callback to update the background image.
   * @param onCloseDialog Callback to close the dialog.
   */
  async handleBuiltInImageSelect(
    imageRef: string,
    onSetBackgroundImage: (ref: string) => Promise<void>,
    onCloseDialog: () => void
  ): Promise<void> {
    await onSetBackgroundImage(imageRef);
    onCloseDialog();
  }
}
