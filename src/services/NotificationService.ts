import notifee, { AndroidImportance, AndroidStyle } from '@notifee/react-native';
import { EventType } from '@notifee/react-native';
import FileViewer from 'react-native-file-viewer';



class NotificationService {
  private channelId: string | undefined;

  async init() {
    this.channelId = await notifee.createChannel({
      id: 'downloads',
      name: 'Download Notifications',
      importance: AndroidImportance.HIGH,
    });

    // Listen to notification presses
    notifee.onForegroundEvent(({ type, detail }) => {
    //   if (type === notifee.EventType.PRESS && detail.notification?.data?.filePath) {
        if (type === EventType.PRESS && detail.notification?.data?.filePath) {
        const filePath = detail.notification.data.filePath as string;
       // this.openFile(filePath);
      }
    });
  }

  async showProgressNotification(fileName: string, progress: number) {
    if (!this.channelId) await this.init();

    await notifee.displayNotification({
      id: 'download',
      title: `Downloading ${fileName}`,
      body: `${Math.floor(progress * 100)}% completed`,
      android: {
        channelId: this.channelId!,
        onlyAlertOnce: true,
        progress: {
          max: 100,
          current: Math.floor(progress * 100),
          indeterminate: false,
        },
        importance: AndroidImportance.HIGH,
        style: { type: AndroidStyle.BIGTEXT, text: 'Downloading file...' },
      },
    });
  }

  async showDownloadComplete(fileName: string, filePath: string) {
    if (!this.channelId) await this.init();

    await notifee.displayNotification({
      id: 'download', // same ID → replaces progress
      title: 'Download Complete',
      body: `${fileName} has been downloaded successfully.`,
      android: {
        channelId: this.channelId!,
        autoCancel: true,
        pressAction: { id: 'default' },
        importance: AndroidImportance.HIGH,
      },
      data: { filePath }, // store file path in notification
    });
  }

//   private openFile(filePath: string) {
//     FileViewer.open(filePath, { showOpenWithDialog: true }).catch((err) => {

//       console.error('Failed to open file:'+filePath, err);
//     });
//   }
}

export default new NotificationService();
