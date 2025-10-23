import notifee, { AndroidImportance, AndroidStyle } from '@notifee/react-native';

class NotificationService {
  private channelId: string | undefined;

  async init() {
    this.channelId = await notifee.createChannel({
      id: 'downloads',
      name: 'Download Notifications',
      importance: AndroidImportance.HIGH,
    });
  }

  async showProgressNotification(fileName: string, progress: number) {
    if (!this.channelId) await this.init();

    await notifee.displayNotification({
      id: 'download', // fixed ID → update same notification
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

  async showDownloadComplete(fileName: string) {
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
    });
  }

  async cancelAll() {
    await notifee.cancelAllNotifications();
  }
}

export default new NotificationService();
