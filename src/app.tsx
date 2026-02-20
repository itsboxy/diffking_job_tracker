import React from 'react';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import JobCreationScreen from './screens/JobCreationScreen';
import JobTrackingScreen from './screens/JobTrackingScreen';
import ArchivedJobsScreen from './screens/ArchivedJobsScreen';
import SettingsScreen from './screens/SettingsScreen';
import QueriesScreen from './screens/QueriesScreen';
import CalendarScreen from './screens/CalendarScreen';
import HandbookRepairScreen from './screens/HandbookRepairScreen';
import HandbookFabricationScreen from './screens/HandbookFabricationScreen';
import BearingSearchScreen from './screens/BearingSearchScreen';
import { SettingsProvider } from './context/SettingsContext';
import UpdateNotification from './components/UpdateNotification';
import OfflineOverlay from './components/OfflineOverlay';

const App: React.FC = () => {
    return (
        <SettingsProvider>
            <Router>
                <UpdateNotification />
                <OfflineOverlay />
                <Switch>
                    <Route path="/" exact component={JobCreationScreen} />
                    <Route path="/track" component={JobTrackingScreen} />
                    <Route path="/queries" component={QueriesScreen} />
                    <Route path="/calendar" component={CalendarScreen} />
                    <Route path="/archive" component={ArchivedJobsScreen} />
                    <Route path="/settings" component={SettingsScreen} />
                    <Route path="/handbook/repair" component={HandbookRepairScreen} />
                    <Route path="/handbook/fabrication" component={HandbookFabricationScreen} />
                    <Route path="/bearing-search" component={BearingSearchScreen} />
                </Switch>
            </Router>
        </SettingsProvider>
    );
};

export default App;