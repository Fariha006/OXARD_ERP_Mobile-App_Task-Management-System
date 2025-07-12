import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any>;

export default function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.back}>
        <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Home' })}>
          <View style={styles.backicon}>
            <Image source={require('../../assets/images/backarow.png')}
              style={styles.backiconimg} resizeMode="contain" />
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.Caption}>
          <Text style={styles.CaptionText}>MyDesk</Text>
      </View>
      <View>
        <View style={styles.logoContainer}>
          <View style={styles.profilepic}>
            <Image source={require('../../assets/images/profile/mydeskprofile.png')}
              style={styles.logo} resizeMode="contain" />
          </View>
        </View>
        <View style={styles.logoContainercode}>
          <Text style={styles.logoContainercodetext}>EMP 457</Text>
        </View>
        <View style={styles.logoContainercode}>
          <Text style={styles.usernametext}>George Fernandes</Text>
        </View>
      </View>

      {/* <View style={styles.mydeskbtnfirstraw}>
        <View style={styles.tilecontainer} >
          <TouchableOpacity key='1' style={styles.tile}>
            <Image source={require('../../assets/images/Circle-icons-profile.svg.png')} style={styles.image} />
            <Text style={styles.title}>Personal information</Text>
          </TouchableOpacity>            
        </View>
        <View>
          <Text >Sr.SoftwareDeveleper</Text>
          <Text >IT.Department</Text>
        </View>
        <View>
          <TouchableOpacity key='1' style={styles.tileend}>
            <Image source={require('../../assets/images/Circle-icons-profile.svg.png')} style={styles.image} />
            <Text style={styles.title}>Personal information</Text>
          </TouchableOpacity>
        </View>
      </View> */}
      <TouchableOpacity>
        <ScrollView>
          <View style={styles.mydeskbtnfirstraw}>
            <View style={[styles.tile, styles.lightblue]}>
              <TouchableOpacity style={styles.algnbtn} onPress={() => navigation.navigate('Main', { screen: 'Personalinfo' })}>
                <Image source={require('../../assets/images/mydesk/pers_info.png')} style={styles.image} />
                <Text style={styles.title}>Personal information</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.userdetail}>
              <Text style={styles.userdesig}>Sr. Software Developer</Text>
              <Text style={styles.userdesig}>IT Department</Text>
            </View>
            <View style={[styles.tile, styles.lightpink]}>
              <TouchableOpacity style={styles.algnbtn} onPress={() => navigation.navigate('Main', { screen: '' })}>
                <Image source={require('../../assets/images/mydesk/addrss.png')} style={styles.image} />
                <Text style={styles.title}>Address</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.mydeskbtnfirstraw}>
            <View style={[styles.tile, styles.lightyllow]}>
              <TouchableOpacity style={styles.algnbtn} onPress={() => navigation.navigate('Main', { screen: '' })}>
                <Image source={require('../../assets/images/mydesk/depnds.png')} style={styles.image} />
                <Text style={styles.title}>Dependents</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.tile, styles.lightblue]}>
              <TouchableOpacity style={styles.algnbtn} onPress={() => navigation.navigate('Main', { screen: '' })}>
                <Image source={require('../../assets/images/mydesk/paymnts.png')} style={styles.image} />
                <Text style={styles.title}>Payments</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.tile, styles.lightyllow]}>
              <TouchableOpacity style={styles.algnbtn} onPress={() => navigation.navigate('Main', { screen: '' })}>
                <Image source={require('../../assets/images/mydesk/qlfction.png')} style={styles.image} />
                <Text style={styles.title}>Qualifications</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.tile, styles.whitebg]}>
              <TouchableOpacity style={styles.algnbtn} onPress={() => navigation.navigate('Main', { screen: '' })}>
                <Image source={require('../../assets/images/mydesk/documentd.png')} style={styles.image} />
                <Text style={styles.title}>Documents</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.mydeskbtnfirstraw}>
            <View style={[styles.tile, styles.lightblue]}>
              <TouchableOpacity style={styles.algnbtn} onPress={() => navigation.navigate('Main', { screen: '' })}>
                <Image source={require('../../assets/images/mydesk/cntctinfo.png')} style={styles.image} />
                <Text style={styles.title}>Contact Info</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.tile, styles.lightpink]}>
              <TouchableOpacity style={styles.algnbtn} onPress={() => navigation.navigate('Main', { screen: '' })}>
                <Image source={require('../../assets/images/mydesk/salry.png')} style={styles.image} />
                <Text style={styles.title}>Salary</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.tile, styles.whitebg]}>
              <TouchableOpacity style={styles.algnbtn} onPress={() => navigation.navigate('Main', { screen: '' })}>
                <Image source={require('../../assets/images/mydesk/eligibilty.png')} style={styles.image} />
                <Text style={styles.title}>Eligibilities</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.tile, styles.lightpink]}>
              <TouchableOpacity style={styles.algnbtn} onPress={() => navigation.navigate('Main', { screen: '' })}>
                <Image source={require('../../assets/images/mydesk/revisn.png')} style={styles.image} />
                <Text style={styles.title}>Revisions</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.mydeskbtnfirstraw}>
            <View style={[styles.tile, styles.whitebg]}>
              <TouchableOpacity style={styles.algnbtn} onPress={() => navigation.navigate('Main', { screen: '' })}>
                <Image source={require('../../assets/images/mydesk/asst.png')} style={styles.image} />
                <Text style={styles.title}>Assets</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.tile, styles.lightyllow]}>
              <TouchableOpacity style={styles.algnbtn} onPress={() => navigation.navigate('Main', { screen: '' })}>
                <Image source={require('../../assets/images/mydesk/leaverqst.png')} style={styles.image} />
                <Text style={styles.title}>Leave Requests</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.tile, styles.lightblue]}>
              <TouchableOpacity style={styles.algnbtn} onPress={() => navigation.navigate('Main', { screen: '' })}>
                <Image source={require('../../assets/images/mydesk/crtfctrqst.png')} style={styles.image} />
                <Text style={styles.title}>Certificates Requests</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.tile, styles.whitebg]}>
              <TouchableOpacity style={styles.algnbtn} onPress={() => navigation.navigate('Main', { screen: '' })}>
                <Image source={require('../../assets/images/mydesk/aprov.png')} style={styles.image} />
                <Text style={styles.title}>Approvals</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 5,
    flexDirection: 'column',
    backgroundColor: '#fff',
  },
  back: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  backicon: {
    marginLeft: 15,
    marginBottom: 10,
  },
  backiconimg: {
    width: 13,
    height: 20,
  },
  Caption: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  CaptionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C40C0A',
  },
  logoContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilepic: {
    borderRadius: 50,
    marginBottom: 13,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 5,
    borderRadius: 100,
  },
  logoContainercode: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainercodetext: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#CB525A',
    margin: 0,
    padding: 0,
  },
  userdetail: {
    textAlign: 'center',
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  userdesig: {
    color: '232323',
    fontSize: 16,
    textAlign: 'center',
  },
  usernametext: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#07478D',
    margin: 0,
    padding: 0,
  },
  mydeskbtnfirstraw: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 2,
    paddingRight: 2,
    paddingTop: 5,
    paddingBottom: 5,
  },
  tile: {
    width: 82,
    height: 75,
    borderRadius: 10,
    marginBottom: 0,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  algnbtn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightblue: {
    backgroundColor: '#F1F6FD',
    borderColor: '#D6DFEC',
  },
  lightpink: {
    backgroundColor: '#FAF4FD',
    borderColor: '#D8C2ED',
  },
  lightyllow: {
    backgroundColor: '#FFFFF6',
    borderColor: '#E3E3B9',
  },
  whitebg: {
    backgroundColor: '#ffffff',
    borderColor: '#A5A5A5',
  },
  image: {
    width: 32,
    height: 32,
    marginBottom: 8,
    resizeMode: 'contain',
    alignItems: 'center'
  },
  title: {
    fontSize: 12,
    textAlign: 'center',
  },
});
