"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Patient } from "@/types/pacientes";
import PatientForm from "@/components/pacientes/PatientForm";
import PatientList from "@/components/pacientes/PatientList";
import Pagination from "@/components/pacientes/Pagination";

export default function PacientesPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("datos-personales");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null);
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [patientsPerPage, setPatientsPerPage] = useState(10);
  const totalPages = Math.ceil(totalPatients / patientsPerPage);

  const [formData, setFormData] = useState({
    primer_nombre: "",
    primer_apellido: "",
    segundo_apellido: "",
    direccion: "",
    telefono: "",
    email: "",
    fecha_nacimiento: "",
    notas: ""
  });

  // Cargar pacientes desde Supabase con paginación
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setIsLoading(true);
        
        // Obtener el total de pacientes para la paginación
        const { count, error: countError } = await supabase
          .from("pacientes")
          .select("*", { count: "exact", head: true });
        
        if (countError) throw countError;
        
        setTotalPatients(count || 0);
        
        // Calcular el rango para la paginación
        const from = (currentPage - 1) * patientsPerPage;
        const to = from + patientsPerPage - 1;
        
        // Obtener los pacientes para la página actual
        const { data, error } = await supabase
          .from("pacientes")
          .select("*")
          .order("created_at", { ascending: false })
          .range(from, to);

        if (error) {
          throw error;
        }

        if (data) {
          setPatients(data);
        }
      } catch (error) {
        console.error("Error al cargar pacientes:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los pacientes",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, [toast, currentPage, patientsPerPage]);

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  // Resetear el formulario
  const resetForm = () => {
    setFormData({
      primer_nombre: "",
      primer_apellido: "",
      segundo_apellido: "",
      direccion: "",
      telefono: "",
      email: "",
      fecha_nacimiento: "",
      notas: ""
    });
    setActiveTab("datos-personales");
    setIsEditing(false);
    setCurrentPatientId(null);
  };

  // Abrir diálogo para editar
  const handleEdit = (patient: Patient) => {
    setFormData({
      primer_nombre: patient.primer_nombre,
      primer_apellido: patient.primer_apellido,
      segundo_apellido: patient.segundo_apellido || "",
      direccion: patient.direccion || "",
      telefono: patient.telefono,
      email: patient.email || "",
      fecha_nacimiento: patient.fecha_nacimiento || "",
      notas: patient.notas || ""
    });
    
    setIsEditing(true);
    setCurrentPatientId(patient.id);
    setIsDialogOpen(true);
  };

  // Eliminar paciente
  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este paciente?")) {
      try {
        const { error } = await supabase
          .from("pacientes")
          .delete()
          .eq("id", id);

        if (error) {
          throw error;
        }

        setPatients(patients.filter(patient => patient.id !== id));
        setTotalPatients(prev => prev - 1);
        
        toast({
          title: "Paciente eliminado",
          description: "El paciente ha sido eliminado correctamente",
        });
      } catch (error) {
        console.error("Error al eliminar paciente:", error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el paciente",
          variant: "destructive",
        });
      }
    }
  };

  // Guardar paciente
  const handleSavePatient = async () => {
    try {
      // Validar campos requeridos
      if (!formData.primer_nombre || !formData.primer_apellido || !formData.telefono) {
        toast({
          title: "Error",
          description: "Por favor completa los campos obligatorios",
          variant: "destructive",
        });
        return;
      }

      let patientId = currentPatientId;
      
      if (isEditing && currentPatientId) {
        // Actualizar paciente existente
        const { data, error } = await supabase
          .from("pacientes")
          .update({
            primer_nombre: formData.primer_nombre,
            primer_apellido: formData.primer_apellido,
            segundo_apellido: formData.segundo_apellido || null,
            direccion: formData.direccion || null,
            telefono: formData.telefono,
            email: formData.email || null,
            fecha_nacimiento: formData.fecha_nacimiento || null,
            notas: formData.notas || null
          })
          .eq("id", currentPatientId)
          .select();

        if (error) {
          throw error;
        }
      } else {
        // Crear nuevo paciente
        const { data, error } = await supabase
          .from("pacientes")
          .insert({
            primer_nombre: formData.primer_nombre,
            primer_apellido: formData.primer_apellido,
            segundo_apellido: formData.segundo_apellido || null,
            direccion: formData.direccion || null,
            telefono: formData.telefono,
            email: formData.email || null,
            fecha_nacimiento: formData.fecha_nacimiento || null,
            notas: formData.notas || null
          })
          .select();

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          patientId = data[0].id;
        }
        
        // Incrementar el contador total de pacientes
        setTotalPatients(prev => prev + 1);
      }

      // Actualizar la lista de pacientes
      const { data: updatedPatient, error: fetchError } = await supabase
        .from("pacientes")
        .select("*")
        .eq("id", patientId)
        .single();
      
      if (fetchError) {
        console.error("Error al obtener paciente actualizado:", fetchError);
      } else if (updatedPatient) {
        if (isEditing) {
          setPatients(patients.map(p => p.id === patientId ? updatedPatient : p));
          toast({
            title: "Paciente actualizado",
            description: "Los datos del paciente han sido actualizados correctamente",
          });
        } else {
          // Si estamos en la primera página, añadir el nuevo paciente al inicio
          if (currentPage === 1) {
            setPatients([updatedPatient, ...patients.slice(0, patientsPerPage - 1)]);
          }
          
          toast({
            title: "Paciente agregado",
            description: "El paciente ha sido agregado correctamente",
          });
        }
      }

      // Cerrar diálogo y resetear formulario
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error al guardar paciente:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el paciente",
        variant: "destructive",
      });
    }
  };

  // Filtrar pacientes según término de búsqueda
  const filteredPatients = patients.filter(
    (patient) =>
      patient.primer_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.primer_apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.segundo_apellido && patient.segundo_apellido.toLowerCase().includes(searchTerm.toLowerCase())) ||
      patient.telefono.includes(searchTerm) ||
      (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Cambiar de página
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    setExpandedPatient(null); // Cerrar cualquier fila expandida al cambiar de página
  };
  
  // Cambiar cantidad de pacientes por página
  const handlePerPageChange = (value: string) => {
    setPatientsPerPage(Number(value));
    setCurrentPage(1); // Volver a la primera página al cambiar la cantidad por página
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona la información de tus pacientes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4 mb-2 border-b">
              <DialogTitle className="text-xl">
                {isEditing ? "Editar Paciente" : "Agregar Nuevo Paciente"}
              </DialogTitle>
              <DialogDescription>
                {isEditing ? "Modifica los datos del paciente" : "Ingresa los datos del nuevo paciente"}
              </DialogDescription>
            </DialogHeader>
            
            <PatientForm 
              formData={formData}
              handleInputChange={handleInputChange}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              handleSavePatient={handleSavePatient}
              isEditing={isEditing}
              setIsDialogOpen={setIsDialogOpen}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pacientes..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                No hay pacientes registrados. Agrega tu primer paciente.
              </p>
            </div>
          ) : (
            <>
              <PatientList 
                patients={filteredPatients}
                expandedPatient={expandedPatient}
                fetchPatientRecetas={(id) => setExpandedPatient(id === expandedPatient ? null : id)}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
              />
              
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                patientsPerPage={patientsPerPage}
                handlePageChange={handlePageChange}
                handlePerPageChange={handlePerPageChange}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}