import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image, Alert } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import HomeScreen from '../screens/HomeScreen';
import DetailsScreen from '../screens/DetailsScreen';
import MydeskScreen from '../screens/MyDeskScreen';
import Personalinformationscreen from '../screens/Personalinformationscreen';
import AddressScreen from '../screens/AddressScreen';
import DependentScreen from '../screens/DependentScreen';
import PaymentsScreen from '../screens/PaymentsScreen';
import QualificationScreen from '../screens/QualificationScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import ContactInfoSceen from '../screens/ContactInfoSceen';
import SalaryScreen from '../screens/SalaryScreen';
import EligibilitiesScreen from '../screens/EligibilitiesScreen';
import ContractRevisionScreen from '../screens/ContractRevisionScreen';
import AssetsScreen from '../screens/AssetsScreen';
import LeaveHistoryScreen from '../screens/LeaveHistoryScreen';
import NotificationScreen from '../screens/NotificationScreen';
import PayslipScreen from '../screens/PayslipScreen';
import CertificateRequestScreen from '../screens/CertificateRequestScreen';
import ApprovalsScreen from '../screens/ApprovalsScreen';
import LeaveOutstandingScreen from '../screens/LeaveOutstandingScreen';
import EmployeeDirectoryScreen from '../screens/EmployeeDirectoryScreen';
import MessegeScreen from '../screens/MessegeScreen';
import LeaveRequestScreen from '../screens/LeaveRequestScreen';
import RequestDashboardScreen from '../screens/RequestDashboardScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CrmDashboardMenu from '../screens/crm/crmdashboardmenu';
import { SafeAreaView } from 'react-native-safe-area-context';
import LeadorDealScreen from '../screens/crm/leadordealscreen';
import LeadOrDealCrudScreen from '../screens/crm/leadordealcrudscreen';
import CompanyCrudScreen from '../screens/crm/companycrudscreen';
import CrnContactListScreen from '../screens/crm/crncontactlistscreen';
import CrmContactCrudScreen from '../screens/crm/crmcontactcrud';
import CrmNoteListScreen from '../screens/crm/crmnotelist';
import CrmNoteCrudScreen from '../screens/crm/crmnotecrud';
import CrmDocumentListScreen from '../screens/crm/crmdocumentlist';
import CrmDocumentCrudScreen from '../screens/crm/crmdocumentcrud';
import CrmTaskListScreen from '../screens/crm/crmtasklist';
import CrmTaskCrudScreen from '../screens/crm/crmtaskcrud';
import CrmMeetingListScreen from '../screens/crm/crmmeetinglist';
import CrmMeetingCrudScreen from '../screens/crm/crmmeetingcrud';
import CrmCallListScreen from '../screens/crm/crmcalllist';
import CrmCallCrudScreen from '../screens/crm/crmcallcrud';
import CrmReportMenuListScreen from '../screens/crm/crmreportmenulist';
import CrmReportScreen from '../screens/crm/crmreportscreen';

const Stack = createStackNavigator();

const InnerStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Home" component={HomeScreen} options={({ navigation, route }) => ({
      header: () => <Header navigation={navigation} route={route} />
    })}
    />
    <Stack.Screen
      name="Details"
      component={DetailsScreen}
      options={({ navigation, route }) => ({
        header: () => <Header navigation={navigation} route={route} />
      })}
    />
    <Stack.Screen
      name="MyDesk"
      component={MydeskScreen}
      options={({ navigation, route }) => ({
        header: () => <Header navigation={navigation} route={route} />
      })}
    />

    <Stack.Screen
          name="Personalinfo"
          component={Personalinformationscreen}
          options={({ navigation, route }) => ({
            header: () => <Header navigation={navigation} route={route} />
          })}
        />
         <Stack.Screen
          name="Address"
          component={AddressScreen}
          options={({ navigation, route }) => ({
            header: () => <Header navigation={navigation} route={route} />
          })}
        />
            <Stack.Screen
          name="Dependent"
          component={DependentScreen}
          options={({ navigation, route }) => ({
            header: () => <Header navigation={navigation} route={route} />
          })}
        />
               <Stack.Screen
          name="Payments"
          component={PaymentsScreen}
          options={({ navigation, route }) => ({
            header: () => <Header navigation={navigation} route={route} />
          })}
        /> 
                 <Stack.Screen
          name="Qualifications"
          component={QualificationScreen}
          options={({ navigation, route }) => ({
            header: () => <Header navigation={navigation} route={route} />
          })}
        /> 

<Stack.Screen
          name="Documents"
          component={DocumentsScreen}
          options={({ navigation, route }) => ({
            header: () => <Header navigation={navigation} route={route} />
          })}
        /> 
        <Stack.Screen
          name="ContactInfo"
          component={ContactInfoSceen}
          options={({ navigation, route }) => ({
            header: () => <Header navigation={navigation} route={route} />
          })}
        /> 
        <Stack.Screen
          name="Salary"
          component={SalaryScreen}
          options={({ navigation, route }) => ({
            header: () => <Header navigation={navigation} route={route} />
          })}
        /> 
          <Stack.Screen
          name="Eligibilities"
          component={EligibilitiesScreen}
          options={({ navigation, route }) => ({
            header: () => <Header navigation={navigation} route={route} />
          })}
        /> 
        <Stack.Screen
          name="ContractRevision"
          component={ContractRevisionScreen}
          options={({ navigation, route }) => ({
            header: () => <Header navigation={navigation} route={route} />
          })}
        /> 
        <Stack.Screen
          name="Assets"
          component={AssetsScreen}
          options={({ navigation, route }) => ({
            header: () => <Header navigation={navigation} route={route} />
          })}
        /> 
        <Stack.Screen
          name="LeaveHistory"
          component={LeaveHistoryScreen}
          options={({ navigation, route }) => ({
            header: () => <Header navigation={navigation} route={route} />
          })}
        /> 
        <Stack.Screen
          name="Notification"
          component={NotificationScreen}
          options={({ navigation, route }) => ({
            header: () => <Header navigation={navigation} route={route} />
          })}
        /> 
        <Stack.Screen
          name="Payslip"
          component={PayslipScreen}
          options={({ navigation, route }) => ({
            header: () => <Header navigation={navigation} route={route} />
          })}
        /> 
        <Stack.Screen
          name="CertificateRequest"
          component={CertificateRequestScreen}
          options={({ navigation, route }) => ({
            header: () => <Header navigation={navigation} route={route} />
          })}
        /> 
        <Stack.Screen
          name="Approvals"
          component={ApprovalsScreen}
          options={({ navigation, route }) => ({
            header: () => <Header navigation={navigation} route={route} />
          })}
        /> 
        <Stack.Screen
          name="LeaveOutstanding"
          component={LeaveOutstandingScreen}
          options={({ navigation, route }) => ({
            header: () => <Header navigation={navigation} route={route} />
          })}
        /> 
        <Stack.Screen
          name="EmployeeDirectory"
          component={EmployeeDirectoryScreen}
          options={({ navigation, route }) => ({
            header: () => <Header navigation={navigation} route={route} />
          })}
        /> 
        <Stack.Screen
          name="Messege"
          component={MessegeScreen}
          options={({ navigation, route }) => ({
            header: () => <Header navigation={navigation} route={route} />
          })}
        /> 
        <Stack.Screen
          name="LeaveRequest"
          component={LeaveRequestScreen}
          options={({ navigation, route }) => ({
            header: () => <Header navigation={navigation} route={route} />
          })}
        /> 
        <Stack.Screen
          name="RequestDashboard"
          component={RequestDashboardScreen}
          options={({ navigation, route }) => ({
            header: () => <Header navigation={navigation} route={route} />
          })}
        /> 
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={({ navigation, route }) => ({
            header: () => <Header navigation={navigation} route={route} />
          })}
        /> 
        <Stack.Screen
          name="CrmDashboard"
          component={CrmDashboardMenu}
          options={({ navigation, route }) => ({
            header: () => <Header navigation={navigation} route={route} />
          })}
        /> 
        <Stack.Screen name="leadordeal" component={LeadorDealScreen} options={({ navigation, route }) => ({
          header: () => <Header navigation={navigation} route={route} />
        })} />
        <Stack.Screen name="leadordealcrud" component={LeadOrDealCrudScreen} options={({ navigation, route }) => ({
          header: () => <Header navigation={navigation} route={route} />
        })} />
        <Stack.Screen name="companycrud" component={CompanyCrudScreen} options={({ navigation, route }) => ({
          header: () => <Header navigation={navigation} route={route} />
        })} />
        <Stack.Screen name="crncontactlist" component={CrnContactListScreen} options={({ navigation, route }) => ({
          header: () => <Header navigation={navigation} route={route} />
        })} />
        <Stack.Screen name="crncontactcrud" component={CrmContactCrudScreen} options={({ navigation, route }) => ({
          header: () => <Header navigation={navigation} route={route} />
        })} />
        <Stack.Screen name="crmnotelist" component={CrmNoteListScreen} options={({ navigation, route }) => ({
          header: () => <Header navigation={navigation} route={route} />
        })} />
        <Stack.Screen name="crmnotecrud" component={CrmNoteCrudScreen} options={({ navigation, route }) => ({
          header: () => <Header navigation={navigation} route={route} />
        })} />
        <Stack.Screen name="crmdocumentlist" component={CrmDocumentListScreen} options={({ navigation, route }) => ({
          header: () => <Header navigation={navigation} route={route} />
        })} />
        <Stack.Screen name="crmdocumentcrud" component={CrmDocumentCrudScreen} options={({ navigation, route }) => ({
          header: () => <Header navigation={navigation} route={route} />
        })} />
        <Stack.Screen name="crmtasklist" component={CrmTaskListScreen} options={({ navigation, route }) => ({
          header: () => <Header navigation={navigation} route={route} />
        })} />
        <Stack.Screen name="crmtaskcrud" component={CrmTaskCrudScreen} options={({ navigation, route }) => ({
          header: () => <Header navigation={navigation} route={route} />
        })} />
        <Stack.Screen name="crmmeetinglist" component={CrmMeetingListScreen} options={({ navigation, route }) => ({
          header: () => <Header navigation={navigation} route={route} />
        })} />
        <Stack.Screen name="crmmeetingcrud" component={CrmMeetingCrudScreen} options={({ navigation, route }) => ({
          header: () => <Header navigation={navigation} route={route} />
        })} />
        <Stack.Screen name="crmcalllist" component={CrmCallListScreen} options={({ navigation, route }) => ({
          header: () => <Header navigation={navigation} route={route} />
        })} />
        <Stack.Screen name="crmcallcrud" component={CrmCallCrudScreen} options={({ navigation, route }) => ({
          header: () => <Header navigation={navigation} route={route} />
        })} />
        <Stack.Screen name="crmreportmenulist" component={CrmReportMenuListScreen} options={({ navigation, route }) => ({
          header: () => <Header navigation={navigation} route={route} />
        })} />
        <Stack.Screen name="crmreportscreen" component={CrmReportScreen} options={({ navigation, route }) => ({
          header: () => <Header navigation={navigation} route={route} />
        })} />
  </Stack.Navigator>
);

const Footer = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={{ backgroundColor: '#811458', }}  edges={[ 'left', 'right','bottom']}>
    <View style={styles.footer}>
      <TouchableOpacity style={styles.btmmenu} onPress={() => navigation.navigate('Main', { screen: 'Home' })}>
        <View><Image source={require('../../assets/images/btmhome.png')}
          style={styles.btmicon} resizeMode="contain" />
        </View>
        <Text style={styles.label}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btmmenu} onPress={() => navigation.navigate('Main', { screen: 'Messege' })}>
        <View><Image source={require('../../assets/images/btmmsgs.png')}
          style={styles.btmicon} resizeMode="contain" />
        </View>
        <Text style={styles.label}>Messeges</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btmmenu} onPress={() => navigation.navigate('Main', { screen: 'LeaveHistory' })}>
        <View><Image source={require('../../assets/images/btmleave.png')}
          style={styles.btmicon} resizeMode="contain" />
        </View>
        <Text style={styles.label}>Leaves</Text>
      </TouchableOpacity>

    <TouchableOpacity style={styles.btmmenu} onPress={() => navigation.navigate('Main', { screen: 'Approvals' })}>
        <View><Image source={require('../../assets/images/btmaprov.png')}
          style={styles.btmicon} resizeMode="contain" />
        </View>
        <Text style={styles.label}>Approval</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btmmenu} onPress={() => {
        Alert.alert(
          'Sign Out',
          'Do you want to Sign out?',
          [
            {
              text: 'No',
              style: 'cancel',
            },
            {
              text: 'Yes',
              style: 'destructive',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      }}>
        <View><Image source={require('../../assets/images/btmsignout.png')}
          style={styles.btmicon} resizeMode="contain" />
        </View>
        <Text style={styles.label}>Sign Out</Text>
      </TouchableOpacity>
    </View>
    </SafeAreaView>
  );
};

const DrawerLayout = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <InnerStack />
      </View>
      <Footer />
    </View>
  );
};

export default DrawerLayout;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#811458',
    backgroundColor: '#811458',
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    color: '#EAEFFF',
  },
  btmmenu: {
    flexDirection: 'column',
    alignItems: 'center',
  }
});
