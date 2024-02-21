<script setup>
import {computed, onMounted, ref} from "vue";
import {createClient} from "@supabase/supabase-js";

const supabaseURL = "https://lsphpfwmbasxgtbkfwsh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzcGhwZndtYmFzeGd0Ymtmd3NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDgxMDc3NTEsImV4cCI6MjAyMzY4Mzc1MX0.sq8ombiklrVPHZd_nK0bQYfTpW1IGPQAciHYTfVGao0";
const supabase = createClient(supabaseURL, supabaseKey);
const daysOfWeek = ref([
    'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'
]);
const selectedDate = ref(null);
const currentDate = ref(new Date());
const viewDate = ref(new Date());
const dataSelectedDate = ref({});
const updateId = ref(undefined);
const dates = ref([]);
const selectedDateTimeStart = ref('');
const selectedDateTimeEnd = ref('');

const currentYear = computed(() => viewDate.value.getFullYear());
const currentMonth = computed(() => viewDate.value.getMonth());
const currentMonthString = computed(() => {
  return viewDate.value.toLocaleString('default', { month: 'long' });
});
const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
});
const daysInBeforeMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 0).getDate();
});
const firstDayOfMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 1).getDay();
});
const blankDays = computed(() => {
  let blankDaysArray = [];
  for (let i = 0; i < firstDayOfMonth.value; i++) {
    blankDaysArray.push(daysInBeforeMonth.value - i);
  }
  return blankDaysArray.reverse();
});
const days = computed(() => {
  let daysArray = [];
  for (let i = 1; i <= daysInMonth.value; i++) { daysArray.push(i); }
  return daysArray;
});
const totalSalaryForViewMonth = computed(() => {
  let total = 0;
  console.log(dates.value)
  dates.value.forEach(date => {
    total += getHours(minusTime(date.time_end, date.time_start)) * 108.33;
  });
  return total;
});

const prevMonth = async () => {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() - 1, viewDate.value.getDate());
  await updateDatesList();
};

const nextMonth = async () => {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, viewDate.value.getDate());
  await updateDatesList();
};

const eqDate = (date1, date2) => {
  if(date1.getFullYear() !== date2.getFullYear()) { return false; }
  if(date1.getMonth() !== date2.getMonth()) { return false; }
  if(date1.getDate() !== date2.getDate()) { return false; }
  return true;
};

const formatDateToFilteringSupabase = (date) => {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

const getDataByDate = async (date) => {
  return (await supabase.from("Dates").select("*").eq("date", formatDateToFilteringSupabase(date))).data;
};

const getDates = async () => {
  const year = viewDate.value.getFullYear();
  const month = viewDate.value.getMonth() + 1;
  return supabase.from("Dates").select("*")
      .gte("date", `${year}-${month}-1`)
      .lte("date", `${year}-${month}-${new Date(year, month, 0).getDate()}`);
};


const onSelectDate = async (event, date) => {
  selectedDateTimeStart.value = '';
  selectedDateTimeEnd.value = '';
  if(selectedDate.value !== null && eqDate(selectedDate.value, date)) {
    selectedDate.value = null;
    return;
  }
  selectedDate.value = date;
  dataSelectedDate.value = await getDataByDate(date);
  console.log(dataSelectedDate.value)
};

onMounted(async () => {
  dates.value = (await getDates()).data;
  console.log(dates.value)
});


const createDateRecord = async (timeStart, timeEnd, date) => {
  const createFields = {
    time_start: timeStart,
    time_end: timeEnd,
    date: formatDateToFilteringSupabase(date)
  };

  if(updateId.value) {
    createFields['id'] = updateId.value;
  }

  const response = await supabase.from("Dates").upsert([
      createFields
  ]).select();
  console.log(response)
  dataSelectedDate.value = response.data;
  updateId.value = undefined;
  await updateDatesList();
};

const updateDatesList = async () => {
  dates.value = await getDates();
  console.log(dates.value)
};

const minusTime = (time1, time2) => {
  let time1_hours = time1.split(':')[0];
  let time1_minutes = time1.split(':')[1];

  let time2_hours = time2.split(':')[0];
  let time2_minutes = time2.split(':')[1];

  let diffMinutes = time1_minutes - time2_minutes;
  if(diffMinutes < 0) {
    time1_hours -= 1;
    diffMinutes *= -1;
  }

  let diffHours = time1_hours - time2_hours;

  if(diffMinutes < 10) { diffMinutes = `0${diffMinutes}`; }
  if(diffHours < 10) { diffHours = `0${diffHours}`; }

  return `${diffHours}:${diffMinutes}`;
};

const getHours = (time) => {
  return time.split(':')[0];
};

const updateDateRecord = () => {
  selectedDateTimeStart.value = dataSelectedDate.value[0].time_start;
  selectedDateTimeEnd.value = dataSelectedDate.value[0].time_end;
  updateId.value = dataSelectedDate.value[0].id;
  dataSelectedDate.value = [];
};



</script>

<template>
  <div class="calendar-control">
    <button @click="prevMonth"><</button>
    <span>{{ currentMonthString }}</span>
    <button @click="nextMonth">></button>
  </div>
  <div class="calendar">
    <div v-for="day in daysOfWeek" class="day-of-week">{{ day }}</div>
    <div v-for="blankDay in blankDays" class="blank-days">{{ blankDay }}</div>
    <div
        @click="onSelectDate($event, new Date(viewDate.getFullYear(), viewDate.getMonth(), date))"
        v-for="date in days" :class="{
          today: (viewDate.getDate() === date) && (currentDate.getMonth() === viewDate.getMonth()),
          selected: (() => {
            if(selectedDate === null) { return false; }
            return (selectedDate.getDate() === date) && (selectedDate.getMonth() === viewDate.getMonth());
          })()
        }"
        class="date-day"
    >{{ date }}</div>
  </div>
  <div class="info">
    <div v-if="selectedDate !== null" class="day-info">
      <div class="title">Информация по выбранному дню</div>
      <div v-if="dataSelectedDate?.length === 0" class="create-new-date-record">
        <p>Create new record</p>
        <div class="input">
          <span>Начало: </span>
          <input v-model="selectedDateTimeStart" type="time" name="timeStart">
        </div>
        <div class="input">
          <span>Конец: </span>
          <input v-model="selectedDateTimeEnd" type="time" name="timeEnd">
        </div>
        <button @click="createDateRecord(selectedDateTimeStart, selectedDateTimeEnd, selectedDate)">CREATE</button>
      </div>
      <div v-else class="info">
        Information about day!
        <p>
          Вы работали с {{ dataSelectedDate[0].time_start }} до {{ dataSelectedDate[0].time_end }}
          <span>
            (<button @click="updateDateRecord">редактировать</button>)
          </span>
        </p>
        <p>Всего отработанно в этот день {{ minusTime(dataSelectedDate[0].time_end, dataSelectedDate[0].time_start) }} часов</p>
        <p>Заработанно {{ getHours(minusTime(dataSelectedDate[0].time_end, dataSelectedDate[0].time_start)) * 108.33 }}рублей</p>
      </div>
    </div>
    <div v-else class="month-info">
      <div class="title">
        Информация по текущему месяцу
      </div>
      <p>Всего за этот месяц заработано {{ totalSalaryForViewMonth }}</p>
    </div>
  </div>
</template>

<style scoped>

.calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid #999999;
}

.blank-days {
  color: #999999;
}

.day-of-week, .date-day, .blank-days {
  text-align: center;
  padding: 1rem 0;
}

.date-day.today {
  background: #e74c3c;
}

.date-day.selected {
  background: #e74c3c;
}

.calendar-control {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.calendar-control > button {
  padding: 1rem;
}

.info {
  height: 99vh;
  position: sticky;
  top: 1vh;
}

.day-info .title,
.month-info .title {
  text-align: center;
  padding: 1rem 0;
}

</style>