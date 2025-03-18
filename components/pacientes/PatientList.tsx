"use client"

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Edit, Trash2, Calendar, Phone, Mail, ChevronDown, ChevronUp, Eye, FileText
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Patient } from "@/types/pacientes";
import PatientRecetas from "./PatientRecetas";
import PatientDetails from "./PatientDetails";

interface PatientListProps {
  patients: Patient[];
  expandedPatient: string | null;
  fetchPatientRecetas: (patientId: string) => void;
  handleEdit: (patient: Patient) => void;
  handleDelete: (id: string) => void;
}

export default function PatientList({
  patients,
  expandedPatient,
  fetchPatientRecetas,
  handleEdit,
  handleDelete
}: PatientListProps) {
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  // Formatear fecha para mostrar
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: es });
    } catch (error) {
      return dateString;
    }
  };

  // Obtener iniciales para el avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="table-container">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead style={{ width: '40px' }}></TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Notas</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4">
                No se encontraron pacientes con ese criterio de búsqueda
              </TableCell>
            </TableRow>
          ) : (
            patients.map((patient) => (
              <React.Fragment key={patient.id}>
                <TableRow className="patient-card">
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 p-0"
                      onClick={() => fetchPatientRecetas(patient.id)}
                    >
                      {expandedPatient === patient.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 bg-primary/10 text-primary">
                        <AvatarFallback>
                          {getInitials(patient.primer_nombre, patient.primer_apellido)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {patient.primer_nombre} {patient.primer_apellido} {patient.segundo_apellido || ''}
                        </div>
                        {patient.fecha_nacimiento && (
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(patient.fecha_nacimiento)}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-1.5 text-muted-foreground" />
                        {patient.telefono}
                      </div>
                      {patient.email && (
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-1.5 text-muted-foreground" />
                          {patient.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {patient.notas ? (
                      <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                        <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{patient.notas}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sin notas</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setSelectedPatient(patient.id)}
                        className="hover:bg-primary/10 hover:text-primary"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEdit(patient)}
                        className="hover:bg-primary/10 hover:text-primary"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(patient.id)}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {expandedPatient === patient.id && (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0 border-t-0">
                      <PatientRecetas patientId={patient.id} />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>

      <PatientDetails
        patientId={selectedPatient || ''}
        isOpen={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />
    </div>
  );
}