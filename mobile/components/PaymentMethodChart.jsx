import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: '#e26a00',
  backgroundGradientFrom: '#fb8c00',
  backgroundGradientTo: '#ffa726',
  decimalPlaces: 2,
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#ffa726',
  },
};

const PaymentMethodChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <View>
        <Text>No data to display</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={{ textAlign: 'center', fontSize: 18, padding: 16 }}>
        Payment Methods Distribution
      </Text>
      <PieChart
        data={data}
        width={screenWidth - 32}
        height={220}
        chartConfig={chartConfig}
        accessor={'total'}
        backgroundColor={'transparent'}
        paddingLeft={'15'}
        absolute
      />
    </View>
  );
};

export default PaymentMethodChart;
