
"use client";

import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface DatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

const MONTHS = [
  { value: 0, label: 'Enero' }, { value: 1, label: 'Febrero' }, { value: 2, label: 'Marzo' },
  { value: 3, label: 'Abril' }, { value: 4, label: 'Mayo' }, { value: 5, label: 'Junio' },
  { value: 6, label: 'Julio' }, { value: 7, label: 'Agosto' }, { value: 8, label: 'Septiembre' },
  { value: 9, label: 'Octubre' }, { value: 10, label: 'Noviembre' }, { value: 11, label: 'Diciembre' }
];

const CURRENT_YEAR = new Date().getFullYear();
const START_YEAR = 1900;
const YEARS = Array.from({ length: CURRENT_YEAR - START_YEAR + 1 }, (_, i) => CURRENT_YEAR - i);

export function DatePicker({ date, onDateChange }: DatePickerProps) {
  const selectedYear = date ? date.getFullYear() : undefined;
  const selectedMonth = date ? date.getMonth() : undefined;
  const selectedDay = date ? date.getDate() : undefined;

  const daysInMonth = selectedYear !== undefined && selectedMonth !== undefined
    ? new Date(selectedYear, selectedMonth + 1, 0).getDate()
    : 31;
  const DAYS = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleYearChange = (yearStr: string) => {
    const year = parseInt(yearStr, 10);
    const newDate = date ? new Date(date) : new Date(0);
    newDate.setFullYear(year);
    // Adjust day if it's invalid for the new month/year
    const newDaysInMonth = new Date(year, newDate.getMonth() + 1, 0).getDate();
    if (newDate.getDate() > newDaysInMonth) {
        newDate.setDate(newDaysInMonth);
    }
    onDateChange(newDate);
  };

  const handleMonthChange = (monthStr: string) => {
    const month = parseInt(monthStr, 10);
    const newDate = date ? new Date(date) : new Date();
    if (!date) newDate.setDate(1); // Default to day 1 if no date
    newDate.setMonth(month);
    // Adjust day if it's invalid for the new month
    const newDaysInMonth = new Date(newDate.getFullYear(), month + 1, 0).getDate();
    if (newDate.getDate() > newDaysInMonth) {
        newDate.setDate(newDaysInMonth);
    }
    onDateChange(newDate);
  };

  const handleDayChange = (dayStr: string) => {
    const day = parseInt(dayStr, 10);
    const newDate = date ? new Date(date) : new Date();
    newDate.setDate(day);
    onDateChange(newDate);
  };


  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <Label htmlFor="date-day" className="sr-only">Día</Label>
        <Select
          value={selectedDay?.toString()}
          onValueChange={handleDayChange}
          disabled={selectedMonth === undefined || selectedYear === undefined}
        >
          <SelectTrigger id="date-day">
            <SelectValue placeholder="Día" />
          </SelectTrigger>
          <SelectContent>
            {DAYS.map(day => (
              <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1">
        <Label htmlFor="date-month" className="sr-only">Mes</Label>
        <Select
          value={selectedMonth?.toString()}
          onValueChange={handleMonthChange}
        >
          <SelectTrigger id="date-month">
            <SelectValue placeholder="Mes" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map(month => (
              <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1">
        <Label htmlFor="date-year" className="sr-only">Año</Label>
        <Select
          value={selectedYear?.toString()}
          onValueChange={handleYearChange}
        >
          <SelectTrigger id="date-year">
            <SelectValue placeholder="Año" />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
